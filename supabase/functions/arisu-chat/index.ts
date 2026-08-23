import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SYSTEM_PROMPT = `You are Arisu, the built-in AI assistant of Cinephile — a personal movie, web series and anime library app.

Identity:
- Your name is Arisu. Introduce yourself as Arisu, "Your Cinephile AI".
- Expertise: Movies, Web Series, TV Series, Anime and the user's own Cinephile library.
- Friendly, concise by default, detailed when asked. Never robotic, never generic.

Rules:
- NEVER invent titles, release dates, seasons, episodes, cast, platforms or ratings. If you cannot verify something, say so plainly and use the search_metadata tool.
- When the user asks about their own library ("what did I add", "do I have X", "my Korean series"), you MUST call search_library first and answer only from those results.
- When the user asks to add something, call search_metadata to identify it, then call add_to_library. Never add duplicates — search_library first.
- When the user asks to open/show a part of the app, call navigate.
- Keep replies short (2-6 sentences or a compact list) unless the user asks for depth.
- Use plain text. Short markdown lists are fine. No huge headings.`;

const TOOLS = [
  {
    type: "function",
    function: {
      name: "search_library",
      description:
        "Search the user's own Cinephile library (movies, web series, anime). Use for any question about what the user has added, watched, rated or favorited.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Title or keyword. Empty string returns everything." },
          type: {
            type: "string",
            enum: ["all", "movie", "web", "animeSeries", "animeMovie"],
            description: "Which library section to search.",
          },
          tag: { type: "string", description: "Optional origin tag filter for web series, e.g. Korean, Marvel." },
          watched: { type: "string", enum: ["any", "yes", "no"], description: "Filter by watched status." },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_metadata",
      description:
        "Look up current, up-to-date metadata for a TV/web series (including brand new releases) to identify it and get country, language, genres, premiere date and summary.",
      parameters: {
        type: "object",
        properties: { title: { type: "string" } },
        required: ["title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_to_library",
      description:
        "Add a title to the user's Cinephile library. The app asks the user to confirm before saving. Only call after checking for duplicates.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          type: { type: "string", enum: ["movie", "web", "animeSeries", "animeMovie"] },
          tag: { type: "string", description: "Origin/category tag for web series, e.g. Korean, Germany, Marvel. Empty for none." },
        },
        required: ["title", "type"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "navigate",
      description: "Open a screen inside Cinephile.",
      parameters: {
        type: "object",
        properties: {
          page: { type: "string", enum: ["home", "movie", "web", "anime", "animeSeries", "animeMovie"] },
        },
        required: ["page"],
      },
    },
  },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => null);
    const messages = body?.messages;
    if (!Array.isArray(messages) || messages.length === 0 || messages.length > 60) {
      return new Response(JSON.stringify({ error: "Invalid messages" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "AI is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const summary = typeof body?.librarySummary === "string" ? body.librarySummary.slice(0, 1500) : "";
    const today = new Date().toISOString().slice(0, 10);

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: `${SYSTEM_PROMPT}\n\nToday's date: ${today}.\n\nUser's library overview: ${summary || "unknown"}` },
          ...messages,
        ],
        tools: TOOLS,
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      const status = res.status === 429 || res.status === 402 ? res.status : 500;
      return new Response(JSON.stringify({ error: status === 429 ? "Arisu is busy, try again in a moment." : status === 402 ? "AI credits exhausted." : "AI request failed", detail: txt.slice(0, 300) }), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    const message = data?.choices?.[0]?.message ?? { role: "assistant", content: "" };
    return new Response(JSON.stringify({ message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "Unexpected error", detail: String(e).slice(0, 200) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
