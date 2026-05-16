import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ============================================
// TABLAS ORCHESTRA HERO (con prefijo oh_)
// ============================================

export interface OHSong {
  id: string
  title: string
  composer: string
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  tempo: number
  instrument: string
  category: string
  musicxml_url: string
  audio_url: string | null
  cover_url: string | null
  created_at: string
  created_by: string | null
}

export interface OHGameProgress {
  id: string
  player_id: string
  song_id: string
  score: number
  accuracy: number
  grade: string
  max_combo: number
  max_streak: number
  fail_count: number
  hits_perfect: number
  hits_great: number
  hits_good: number
  hits_ok: number
  hits_miss: number
  practice_mode: string
  completion_time: number
  is_completed: boolean
  attempts: number
  created_at: string
  updated_at: string
}

export interface OHPlayerAchievement {
  id: string
  player_id: string
  achievement_id: string
  unlocked_at: string
}

// Legacy types (deprecated)
export interface Song extends OHSong {}
export interface UserProgress extends OHGameProgress {}

// ============================================
// FUNCIONES DE BASE DE DATOS
// ============================================

// Obtener canciones
export async function getSongs(instrument?: string): Promise<OHSong[]> {
  let query = supabase.from('oh_songs').select('*').order('title')
  if (instrument) {
    query = query.eq('instrument', instrument)
  }
  const { data, error } = await query
  if (error) throw error
  return data || []
}

// Obtener canción por ID
export async function getSongById(id: string): Promise<OHSong | null> {
  const { data, error } = await supabase
    .from('oh_songs')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

// Guardar progreso del jugador
export async function saveProgress(progress: Omit<OHGameProgress, 'id' | 'created_at' | 'updated_at'>): Promise<OHGameProgress> {
  const { data, error } = await supabase
    .from('oh_game_progress')
    .insert(progress)
    .select()
    .single()
  if (error) throw error
  return data
}

// Obtener progreso del jugador
export async function getPlayerProgress(playerId: string): Promise<OHGameProgress[]> {
  const { data, error } = await supabase
    .from('oh_game_progress')
    .select('*')
    .eq('player_id', playerId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

// Obtener leaderboard de una canción
export async function getLeaderboard(songId: string, limit = 10): Promise<OHGameProgress[]> {
  const { data, error } = await supabase
    .from('oh_game_progress')
    .select('*')
    .eq('song_id', songId)
    .eq('is_completed', true)
    .order('score', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data || []
}

// Desbloquear logro
export async function unlockAchievement(playerId: string, achievementId: string): Promise<void> {
  const { error } = await supabase
    .from('oh_player_achievements')
    .insert({ player_id: playerId, achievement_id: achievementId })
  if (error) console.error('Error unlocking achievement:', error)
}

// Obtener logros del jugador
export async function getPlayerAchievements(playerId: string): Promise<OHPlayerAchievement[]> {
  const { data, error } = await supabase
    .from('oh_player_achievements')
    .select('*')
    .eq('player_id', playerId)
  if (error) throw error
  return data || []
}

// Instrument configurations
export const INSTRUMENTS = {
  violin: { 
    name: 'Violin', 
    color: '#9b30ff', 
    laneKeys: ['E', 'A', 'D', 'G'],
    range: { low: 55, high: 103 }
  },
  viola: { 
    name: 'Viola', 
    color: '#cc6633', 
    laneKeys: ['C', 'G', 'D', 'A'],
    range: { low: 50, high: 93 }
  },
  cello: { 
    name: 'Cello', 
    color: '#8b4513', 
    laneKeys: ['C', 'G', 'D', 'A'],
    range: { low: 36, high: 96 }
  },
  double_bass: { 
    name: 'Double Bass', 
    color: '#4a3728', 
    laneKeys: ['E', 'A', 'D', 'G'],
    range: { low: 28, high: 67 }
  },
  flute: { 
    name: 'Flute', 
    color: '#87ceeb', 
    laneKeys: ['C', 'D', 'E', 'F'],
    range: { low: 60, high: 108 }
  },
  oboe: { 
    name: 'Oboe', 
    color: '#deb887', 
    laneKeys: ['C', 'D', 'E', 'F'],
    range: { low: 58, high: 89 }
  },
  clarinet: { 
    name: 'Clarinet', 
    color: '#ffd700', 
    laneKeys: ['C', 'D', 'E', 'F'],
    range: { low: 50, high: 103 }
  },
  bassoon: { 
    name: 'Bassoon', 
    color: '#8b7355', 
    laneKeys: ['C', 'D', 'E', 'F'],
    range: { low: 34, high: 75 }
  },
  french_horn: { 
    name: 'French Horn', 
    color: '#daa520', 
    laneKeys: ['B', 'C', 'D', 'E'],
    range: { low: 41, high: 89 }
  },
  trumpet: { 
    name: 'Trumpet', 
    color: '#ff8c00', 
    laneKeys: ['C', 'D', 'E', 'F'],
    range: { low: 50, high: 96 }
  },
  trombone: { 
    name: 'Trombone', 
    color: '#cd853f', 
    laneKeys: ['E', 'F', 'G', 'A'],
    range: { low: 40, high: 75 }
  },
  tuba: { 
    name: 'Tuba', 
    color: '#8b7355', 
    laneKeys: ['C', 'D', 'E', 'F'],
    range: { low: 28, high: 65 }
  },
  piano: { 
    name: 'Piano', 
    color: '#4a4a5a', 
    laneKeys: ['C', 'D', 'E', 'F', 'G'],
    range: { low: 21, high: 108 }
  },
}

export type InstrumentKey = keyof typeof INSTRUMENTS