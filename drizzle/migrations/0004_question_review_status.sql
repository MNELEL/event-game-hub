ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS review_status text NOT NULL DEFAULT 'approved';
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS review_note text;
UPDATE public.questions SET review_status = 'pending' WHERE source = 'ai';