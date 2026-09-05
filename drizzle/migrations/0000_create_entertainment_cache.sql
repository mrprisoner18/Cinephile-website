CREATE TABLE public.entertainment_cache (
  cache_key text PRIMARY KEY,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.entertainment_cache TO anon;
GRANT ALL ON public.entertainment_cache TO service_role;
ALTER TABLE public.entertainment_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read entertainment cache" ON public.entertainment_cache FOR SELECT TO anon USING (true);
CREATE OR REPLACE FUNCTION public.upsert_entertainment_cache(
  p_cache_key text,
  p_payload jsonb,
  p_expires_at timestamptz
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_cache_key IS NULL OR p_cache_key NOT IN ('new-releases', 'new-episodes', 'upcoming') THEN
    RAISE EXCEPTION 'Invalid cache key';
  END IF;
  IF p_payload IS NULL OR octet_length(p_payload::text) > 500000 THEN
    RAISE EXCEPTION 'Invalid cache payload';
  END IF;
  INSERT INTO public.entertainment_cache(cache_key, payload, fetched_at, expires_at, updated_at)
  VALUES (p_cache_key, p_payload, now(), p_expires_at, now())
  ON CONFLICT (cache_key) DO UPDATE SET
    payload = excluded.payload,
    fetched_at = excluded.fetched_at,
    expires_at = excluded.expires_at,
    updated_at = excluded.updated_at;
END;
$$;
GRANT EXECUTE ON FUNCTION public.upsert_entertainment_cache(text, jsonb, timestamptz) TO anon;
GRANT EXECUTE ON FUNCTION public.upsert_entertainment_cache(text, jsonb, timestamptz) TO service_role;