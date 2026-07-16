-- Migration: Create store_settings table for global variables like takeaway queue

CREATE TABLE IF NOT EXISTS public.store_settings (
  id TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "store_settings_select" ON public.store_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "store_settings_insert" ON public.store_settings FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "store_settings_update" ON public.store_settings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- Insert default takeaway queue setting
INSERT INTO public.store_settings (id, value) 
VALUES ('takeaway_queue', '{"counter": 1}'::jsonb)
ON CONFLICT (id) DO NOTHING;
