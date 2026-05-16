import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Song {
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

export interface UserProgress {
  id: string
  user_id: string
  song_id: string
  score: number
  accuracy: number
  grade: string
  max_combo: number
  played_at: string
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