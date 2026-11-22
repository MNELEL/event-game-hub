ALTER TABLE public.branding ALTER COLUMN phone SET DEFAULT '077-2267604';
UPDATE public.branding SET phone = '077-2267604', updated_at = now() WHERE phone = '03-7737970' OR phone IS NULL;