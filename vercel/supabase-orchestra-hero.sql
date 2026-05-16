-- Orchestra Hero - Tablas específicas del juego
-- Prefijo: oh_ (orchestra hero)
-- Estas tablas no afectan tu academia existente

-- ============================================
-- TABLA DE CANCIONES
-- ============================================
CREATE TABLE IF NOT EXISTS oh_songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  composer TEXT DEFAULT 'Unknown',
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced', 'expert')) DEFAULT 'beginner',
  tempo INTEGER DEFAULT 120,
  instrument TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  musicxml_url TEXT NOT NULL,
  audio_url TEXT,
  cover_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT
);

-- ============================================
-- TABLA DE PROGRESO DEL JUGADOR
-- ============================================
CREATE TABLE IF NOT EXISTS oh_game_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id TEXT NOT NULL,  -- ID del usuario en tu sistema (users.id)
  song_id UUID REFERENCES oh_songs(id) ON DELETE CASCADE,
  
  -- Puntuación
  score INTEGER DEFAULT 0,
  accuracy REAL DEFAULT 0,
  grade TEXT DEFAULT 'F',
  max_combo INTEGER DEFAULT 0,
  max_streak INTEGER DEFAULT 0,
  fail_count INTEGER DEFAULT 0,
  
  -- Desglose de aciertos
  hits_perfect INTEGER DEFAULT 0,
  hits_great INTEGER DEFAULT 0,
  hits_good INTEGER DEFAULT 0,
  hits_ok INTEGER DEFAULT 0,
  hits_miss INTEGER DEFAULT 0,
  
  -- Metadata
  practice_mode TEXT DEFAULT 'microphone',
  completion_time INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  attempts INTEGER DEFAULT 1,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABLA DE LOGROS DEL JUGADOR
-- ============================================
CREATE TABLE IF NOT EXISTS oh_player_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id TEXT NOT NULL,
  achievement_id TEXT NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ÍNDICES
-- ============================================
CREATE INDEX idx_oh_songs_instrument ON oh_songs(instrument);
CREATE INDEX idx_oh_songs_difficulty ON oh_songs(difficulty);
CREATE INDEX idx_oh_game_progress_player ON oh_game_progress(player_id);
CREATE INDEX idx_oh_game_progress_song ON oh_game_progress(song_id);
CREATE INDEX idx_oh_player_achievements_player ON oh_player_achievements(player_id);

-- ============================================
-- SEGURIDAD (RLS)
-- ============================================
ALTER TABLE oh_songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE oh_game_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE oh_player_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Songs are public" ON oh_songs FOR SELECT USING (true);
CREATE POLICY "Player progress is private" ON oh_game_progress FOR SELECT USING (true);
CREATE POLICY "Achievements are private" ON oh_player_achievements FOR SELECT USING (true);

-- ============================================
-- CANCIONES DE EJEMPLO
-- ============================================
INSERT INTO oh_songs (title, composer, difficulty, tempo, instrument, category) VALUES
  ('Ode to Joy', 'Beethoven', 'beginner', 120, 'violin', 'classical'),
  ('Canon in D', 'Pachelbel', 'beginner', 70, 'violin', 'baroque'),
  ('Spring Sonata - 1st Mvt', 'Beethoven', 'intermediate', 100, 'violin', 'classical'),
  ('Swan Lake Theme', 'Tchaikovsky', 'intermediate', 90, 'violin', 'classical'),
  ('Flight of the Bumblebee', 'Rimsky-Korsakov', 'expert', 180, 'flute', 'classical'),
  ('Clair de Lune', 'Debussy', 'beginner', 60, 'piano', 'classical'),
  ('Nocturne Op.9 No.2', 'Chopin', 'intermediate', 70, 'piano', 'classical'),
  ('Minuet in G', 'Bach', 'beginner', 90, 'viola', 'baroque'),
  ('Csardas', 'Monti', 'advanced', 140, 'violin', 'classical'),
  ('Simple Scale C Major', 'Practice', 'beginner', 80, 'violin', 'practice');

-- ============================================
-- FUNCIONES ÚTILES
-- ============================================

-- Obtener leaderboard de una canción
CREATE OR REPLACE FUNCTION get_oh_leaderboard(p_song_id UUID, p_limit INTEGER DEFAULT 10)
RETURNS TABLE (player_id TEXT, score INTEGER, accuracy REAL, grade TEXT, max_combo INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT gp.player_id, gp.score, gp.accuracy, gp.grade, gp.max_combo
  FROM oh_game_progress gp
  WHERE gp.song_id = p_song_id AND gp.is_completed = true
  ORDER BY gp.score DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Obtener progreso del jugador
CREATE OR REPLACE FUNCTION get_oh_player_progress(p_player_id TEXT)
RETURNS TABLE (
  total_songs INTEGER, 
  completed_songs INTEGER, 
  avg_accuracy REAL,
  total_score INTEGER,
  current_level INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT gp.song_id)::INTEGER,
    COUNT(gp.id) FILTER (WHERE gp.is_completed)::INTEGER,
    COALESCE(AVG(gp.accuracy), 0)::REAL,
    COALESCE(SUM(gp.score), 0)::INTEGER,
    (COALESCE(SUM(gp.score), 0) / 1000)::INTEGER + 1;
END;
$$ LANGUAGE plpgsql;