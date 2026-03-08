
-- Function for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Questions bank (template questions, not tied to a specific game)
CREATE TABLE public.questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  text TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]',
  correct_answer INTEGER NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'כללי',
  time_limit INTEGER NOT NULL DEFAULT 15,
  points INTEGER NOT NULL DEFAULT 100,
  media_url TEXT,
  media_type TEXT DEFAULT 'none',
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- Anyone can read questions (needed for game play)
CREATE POLICY "Anyone can read questions" ON public.questions FOR SELECT USING (true);
-- Only authenticated users (admin) can manage questions
CREATE POLICY "Authenticated users can insert questions" ON public.questions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update questions" ON public.questions FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete questions" ON public.questions FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON public.questions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Game sessions
CREATE TABLE public.games (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'lobby',
  current_question_index INTEGER NOT NULL DEFAULT 0,
  time_remaining INTEGER NOT NULL DEFAULT 15,
  settings JSONB NOT NULL DEFAULT '{}',
  question_ids UUID[] NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

-- Anyone can read games (players need to see game state)
CREATE POLICY "Anyone can read games" ON public.games FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create games" ON public.games FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update games" ON public.games FOR UPDATE TO authenticated USING (true);

CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON public.games FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for games
ALTER PUBLICATION supabase_realtime ADD TABLE public.games;

-- Players in a game session
CREATE TABLE public.players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  connected BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

-- Anyone can read/insert players (players join without auth)
CREATE POLICY "Anyone can read players" ON public.players FOR SELECT USING (true);
CREATE POLICY "Anyone can join as player" ON public.players FOR INSERT WITH CHECK (true);
-- Only authenticated (admin) can update player scores
CREATE POLICY "Authenticated users can update players" ON public.players FOR UPDATE TO authenticated USING (true);

-- Enable realtime for players
ALTER PUBLICATION supabase_realtime ADD TABLE public.players;

-- Player answers
CREATE TABLE public.player_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  answer INTEGER NOT NULL,
  correct BOOLEAN NOT NULL DEFAULT false,
  time_taken FLOAT NOT NULL DEFAULT 0,
  points_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.player_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read answers" ON public.player_answers FOR SELECT USING (true);
CREATE POLICY "Anyone can submit answers" ON public.player_answers FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update answers" ON public.player_answers FOR UPDATE TO authenticated USING (true);

-- Enable realtime for player_answers
ALTER PUBLICATION supabase_realtime ADD TABLE public.player_answers;

-- Game settings table
CREATE TABLE public.game_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'מגה מוח',
  questions_per_game INTEGER NOT NULL DEFAULT 10,
  default_time_limit INTEGER NOT NULL DEFAULT 15,
  selected_categories TEXT[] NOT NULL DEFAULT '{}',
  show_leaderboard_after_each BOOLEAN NOT NULL DEFAULT true,
  shuffle_questions BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.game_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read settings" ON public.game_settings FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage settings" ON public.game_settings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update settings" ON public.game_settings FOR UPDATE TO authenticated USING (true);

CREATE TRIGGER update_game_settings_updated_at BEFORE UPDATE ON public.game_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.game_settings (title) VALUES ('מגה מוח');
