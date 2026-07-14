-- Add gender column to users and customers
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS gender TEXT;
