REVOKE EXECUTE ON FUNCTION public.upsert_entertainment_cache(text, jsonb, timestamptz) FROM anon;
GRANT EXECUTE ON FUNCTION public.upsert_entertainment_cache(text, jsonb, timestamptz) TO service_role;