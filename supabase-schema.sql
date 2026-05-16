-- Orchestra Hero - Database Schema
-- Execute this in your Supabase SQL Editor

-- ============================================
-- SONGS TABLE (already created earlier)
-- ============================================
CREATE TABLE IF NOT EXISTS songs (
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
-- STUDENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  instrument TEXT NOT NULL,
  level TEXT DEFAULT 'beginner',
  total_practice_time INTEGER DEFAULT 0, -- in seconds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- ============================================
-- STUDENT PROGRESS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS student_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
  
  -- Score data
  score INTEGER DEFAULT 0,
  accuracy REAL DEFAULT 0,
  grade TEXT DEFAULT 'F',
  max_combo INTEGER DEFAULT 0,
  max_streak INTEGER DEFAULT 0,
  fail_count INTEGER DEFAULT 0,
  
  -- Hit breakdown
  hits_perfect INTEGER DEFAULT 0,
  hits_great INTEGER DEFAULT 0,
  hits_good INTEGER DEFAULT 0,
  hits_ok INTEGER DEFAULT 0,
  hits_miss INTEGER DEFAULT 0,
  
  -- Metadata
  practice_mode TEXT DEFAULT 'keyboard', -- 'keyboard' or 'microphone'
  completion_time INTEGER DEFAULT 0, -- in seconds
  is_completed BOOLEAN DEFAULT false,
  attempts INTEGER DEFAULT 1,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ASSIGNMENTS TABLE (for teachers)
-- ============================================
CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id TEXT NOT NULL,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
  
  due_date DATE,
  required_accuracy REAL DEFAULT 80, -- percentage
  status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'overdue'
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_songs_instrument ON songs(instrument);
CREATE INDEX idx_songs_difficulty ON songs(difficulty);
CREATE INDEX idx_students_instrument ON students(instrument);
CREATE INDEX idx_student_progress_student ON student_progress(student_id);
CREATE INDEX idx_student_progress_song ON student_progress(song_id);
CREATE INDEX idx_assignments_student ON assignments(student_id);

-- ============================================
-- STORAGE
-- ============================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('music', 'music', true), ('covers', 'covers', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Public music files" ON storage.objects FOR SELECT USING ( bucket_id = 'music' );
CREATE POLICY "Public cover files" ON storage.objects FOR SELECT USING ( bucket_id = 'covers' );
CREATE POLICY "Upload music" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'music' );
CREATE POLICY "Upload covers" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'covers' );

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Songs are public" ON songs FOR SELECT USING (true);
CREATE POLICY "Progress is private" ON student_progress FOR SELECT USING (true);
CREATE POLICY "Assignments are private" ON assignments FOR SELECT USING (true);

-- ============================================
-- EXAMPLE DATA
-- ============================================
-- Insert sample songs
INSERT INTO songs (title, composer, difficulty, tempo, instrument, category) VALUES
  ('Ode to Joy', 'Beethoven', 'beginner', 120, 'violin', 'classical'),
  ('Canon in D', 'Pachelbel', 'beginner', 70, 'violin', 'baroque'),
  ('Spring Sonata - 1st Mvt', 'Beethoven', 'intermediate', 100, 'violin', 'classical'),
  ('Swan Lake Theme', 'Tchaikovsky', 'intermediate', 90, 'violin', 'classical'),
  ('Flight of the Bumblebee', 'Rimsky-Korsakov', 'expert', 180, 'flute', 'classical'),
  ('Clair de Lune', 'Debussy', 'beginner', 60, 'piano', 'classical'),
  ('Nocturne Op.9 No.2', 'Chopin', 'intermediate', 70, 'piano', 'classical'),
  ('Hungarian Rhapsody No.2', 'Liszt', 'expert', 150, 'piano', 'classical'),
  ('Minuet in G', 'Bach', 'beginner', 90, 'viola', 'baroque'),
  ('csardas', 'Monti', 'advanced', 140, 'violin', 'classical');

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to get student leaderboard
CREATE OR REPLACE FUNCTION get_leaderboard(p_song_id UUID, p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  student_name TEXT,
  instrument TEXT,
  score INTEGER,
  accuracy REAL,
  grade TEXT,
  max_combo INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.name,
    s.instrument,
    sp.score,
    sp.accuracy,
    sp.grade,
    sp.max_combo
  FROM student_progress sp
  JOIN students s ON sp.student_id = s.id
  WHERE sp.song_id = p_song_id
  ORDER BY sp.score DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to get student statistics
CREATE OR REPLACE FUNCTION get_student_stats(p_student_id UUID)
RETURNS TABLE (
  total_songs INTEGER,
  completed_songs INTEGER,
  avg_accuracy REAL,
  total_practice_time INTEGER,
  current_streak INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT sp.song_id)::INTEGER,
    COUNT(sp.id) FILTER (WHERE sp.is_completed)::INTEGER,
    COALESCE(AVG(sp.accuracy), 0)::REAL,
    COALESCE(SUM(sp.completion_time), 0)::INTEGER,
    (SELECT COUNT(*) FROM student_progress 
     WHERE student_id = p_student_id 
     AND created_at > NOW() - INTERVAL '7 days')::INTEGER;
END;
$$ LANGUAGE plpgsql;