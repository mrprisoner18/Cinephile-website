import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { authenticateCronRequest } from "../_shared/cron-auth.ts";

const SEARCH_URL = "https://connector-gateway.lovable.dev/firecrawl/v2/search";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isScheduledCallback(req: Request) {
  const expected = Deno.env.get("SUPABASE_ANON_KEY");
  const provided = req.headers.get("apikey");
  return Boolean(expected && provided === expected);
}

async function search(query: string, firecrawlKey: string, lovableKey: string) {
  const response = await fetch(SEARCH_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": firecrawlKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, limit: 8, tbs: "qdr:d", scrapeOptions: { formats: ["markdown"] } }),
  });
  if (!response.ok) throw new Error(`Search failed with ${response.status}`);
  const data = await response.json();
  return Array.isArray(data?.data)
    ? data.data.slice(0, 8)
    : Array.isArray(data?.data?.web)
      ? data.data.web.slice(0, 8)
      : Array.isArray(data?.data?.news)
        ? data.data.news.slice(0, 8)
        : Array.isArray(data?.results)
          ? data.results.slice(0, 8)
          : [];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const cronAuth = authenticateCronRequest(req);
  if (cronAuth && !isScheduledCallback(req)) {
    return new Response(cronAuth.body, { status: cronAuth.status, headers: corsHeaders });
  }

  try {
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!lovableKey || !firecrawlKey || !supabaseUrl || !serviceRoleKey) return json({ error: "Sync is not configured" }, 503);

    const queries = [
      ["new-releases", "new movies and TV series released today entertainment"],
      ["new-episodes", "new TV web series anime episodes released today"],
      ["upcoming", "upcoming movies TV series anime release dates announcements trailers"],
    ] as const;
    const fetchedAt = new Date().toISOString();
    const cache = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
    const records = [];

    for (const [cacheKey, query] of queries) {
      const results = await search(query, firecrawlKey, lovableKey);
      const payload = results.map((row: Record<string, unknown>) => ({
        title: typeof row.title === "string" ? row.title.slice(0, 220) : "Untitled result",
        url: typeof row.url === "string" ? row.url : "",
        description: typeof row.description === "string" ? row.description.slice(0, 500) : "",
        content: typeof row.markdown === "string" ? row.markdown.slice(0, 1800) : "",
      })).filter((row: { url: string }) => row.url);

      const { error } = await cache.rpc("upsert_entertainment_cache", {
        p_cache_key: cacheKey,
        p_payload: { query, fetchedAt, results: payload },
        p_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });
      if (error) throw new Error(`Cache write failed: ${error.message}`);
      records.push({ cacheKey, count: payload.length });
    }

    return json({ ok: true, fetchedAt, records });
  } catch (error) {
    console.error("Entertainment sync failed", error);
    return json({ error: "Entertainment sync failed" }, 502);
  }
});