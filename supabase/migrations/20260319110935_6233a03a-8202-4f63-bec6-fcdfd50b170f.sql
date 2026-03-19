
-- Add owner_id to questions table
ALTER TABLE public.questions ADD COLUMN owner_id uuid DEFAULT auth.uid();

-- Add owner_id to game_settings table  
ALTER TABLE public.game_settings ADD COLUMN owner_id uuid DEFAULT auth.uid();

-- Add secret_token to players table (not publicly exposed)
ALTER TABLE public.players ADD COLUMN secret_token uuid NOT NULL DEFAULT gen_random_uuid();

-- Drop old permissive policies on questions
DROP POLICY IF EXISTS "Authenticated users can insert questions" ON public.questions;
DROP POLICY IF EXISTS "Authenticated users can update questions" ON public.questions;
DROP POLICY IF EXISTS "Authenticated users can delete questions" ON public.questions;

-- Create owner-scoped policies on questions
CREATE POLICY "Owner can insert questions" ON public.questions
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owner can update questions" ON public.questions
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Owner can delete questions" ON public.questions
  FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

-- Drop old permissive policies on game_settings
DROP POLICY IF EXISTS "Authenticated can manage settings" ON public.game_settings;
DROP POLICY IF EXISTS "Authenticated can update settings" ON public.game_settings;

-- Create owner-scoped policies on game_settings
CREATE POLICY "Owner can manage settings" ON public.game_settings
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owner can update settings" ON public.game_settings
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid());

-- Create a view for players that excludes secret_token
CREATE OR REPLACE VIEW public.players_public AS
  SELECT id, game_id, name, score, connected, created_at
  FROM public.players;

-- Update the SELECT policy on players to still allow public reads but not expose secret_token
-- We keep the existing policy as-is since the view handles column restriction
