UPDATE public.questions
SET owner_id = '774c8ab5-03d6-4092-8dae-70583f507a69'
WHERE owner_id IS NULL;

UPDATE public.game_settings
SET owner_id = '774c8ab5-03d6-4092-8dae-70583f507a69'
WHERE owner_id IS NULL;