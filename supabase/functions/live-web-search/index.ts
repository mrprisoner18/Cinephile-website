import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/firecrawl/v2/search";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const body = await req.json().catch(() => null);
    const query = typeof body?.query === "string" ? body.query.trim().slice(0, 500) : "";
    const timeRange = ["none", "day", "week", "month", "year"].includes(body?.timeRange) ? body.timeRange : "none";
    if (!query) return json({ error: "A search query is required" }, 400);

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const firecrawlApiKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!lovableApiKey || !firecrawlApiKey) return json({ error: "Live search is not configured" }, 503);

    const response = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "X-Connection-Api-Key": firecrawlApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        limit: 6,
        tbs: timeRange === "day" ? "qdr:d" : timeRange === "week" ? "qdr:w" : timeRange === "month" ? "qdr:m" : timeRange === "year" ? "qdr:y" : undefined,
        scrapeOptions: { formats: ["markdown"] },
      }),
    });
    if (!response.ok) {
      const details = (await response.text()).slice(0, 600);
      console.error(`Live search failed [${response.status}]: ${details}`);
      return json({ error: "I couldn't access current web information right now.", status: response.status }, response.status);
    }

    const payload = await response.json();
    const rows = Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.data?.web)
        ? payload.data.web
        : Array.isArray(payload?.data?.news)
          ? payload.data.news
          : Array.isArray(payload?.results)
            ? payload.results
            : [];
    const results = rows.slice(0, 6).map((row: Record<string, unknown>) => ({
      title: typeof row.title === "string" ? row.title.slice(0, 220) : "Untitled result",
      url: typeof row.url === "string" ? row.url : "",
      description: typeof row.description === "string" ? row.description.slice(0, 500) : "",
      content: typeof row.markdown === "string" ? row.markdown.slice(0, 1800) : "",
    })).filter((row: { url: string }) => row.url);

    return json({
      query,
      searchedAt: new Date().toISOString(),
      results,
      note: results.length ? "These are live search results. Verify important details against the linked source." : "No current results were found.",
    });
  } catch (error) {
    console.error("Live search exception", error);
    return json({ error: "I couldn't access current web information right now." }, 502);
  }
});