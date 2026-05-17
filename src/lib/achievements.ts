// Achievements and Rewards System for Music Trainer

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  condition: (stats: PlayerStats) => boolean
  xp: number
}

export interface PlayerStats {
  totalPlays: number
  totalScore: number
  totalNotesHit: number
  perfectCount: number
  maxCombo: number
  maxStreak: number
  instrumentsPlayed: string[]
  songsCompleted: string[]
  practiceTime: number // in seconds
  currentLevel: number
}

export const ACHIEVEMENTS: Achievement[] = [
  // First Steps
  {
    id: 'first_note',
    name: 'Primera Nota',
    description: 'Toca tu primera nota',
    icon: '🎵',
    rarity: 'common',
    condition: (s) => s.totalNotesHit >= 1,
    xp: 10
  },
  {
    id: 'first_song',
    name: 'Primera Canción',
    description: 'Completa tu primera canción',
    icon: '🎶',
    rarity: 'common',
    condition: (s) => s.songsCompleted.length >= 1,
    xp: 50
  },
  {
    id: 'first_perfect',
    name: 'Acierta Perfecto',
    description: 'Consigue un timing Perfect',
    icon: '⭐',
    rarity: 'common',
    condition: (s) => s.perfectCount >= 1,
    xp: 20
  },
  
  // Combo Achievements
  {
    id: 'combo_5',
    name: 'Combo de 5',
    description: 'Consigue 5 hits seguidos',
    icon: '🔥',
    rarity: 'common',
    condition: (s) => s.maxCombo >= 5,
    xp: 30
  },
  {
    id: 'combo_10',
    name: 'Racha de 10',
    description: 'Consigue 10 hits seguidos',
    icon: '💥',
    rarity: 'rare',
    condition: (s) => s.maxCombo >= 10,
    xp: 75
  },
  {
    id: 'combo_30',
    name: 'Maestro de la Racha',
    description: 'Consigue 30 hits seguidos',
    icon: '🏆',
    rarity: 'epic',
    condition: (s) => s.maxCombo >= 30,
    xp: 200
  },
  {
    id: 'combo_50',
    name: 'Leyenda',
    description: 'Consigue 50 hits seguidos',
    icon: '👑',
    rarity: 'legendary',
    condition: (s) => s.maxCombo >= 50,
    xp: 500
  },
  
  // Score Achievements
  {
    id: 'score_1000',
    name: 'Mil Puntos',
    description: 'Alcanza 1000 puntos',
    icon: '🎯',
    rarity: 'common',
    condition: (s) => s.totalScore >= 1000,
    xp: 50
  },
  {
    id: 'score_10000',
    name: 'Degustación de puntos',
    description: 'Alcanza 10,000 puntos',
    icon: '💎',
    rarity: 'rare',
    condition: (s) => s.totalScore >= 10000,
    xp: 150
  },
  {
    id: 'score_100000',
    name: 'Centenario',
    description: 'Alcanza 100,000 puntos',
    icon: '🏅',
    rarity: 'epic',
    condition: (s) => s.totalScore >= 100000,
    xp: 500
  },
  
  // Perfect Achievements
  {
    id: 'perfect_10',
    name: 'Diez Perfectos',
    description: 'Consigue 10 timings Perfect',
    icon: '✨',
    rarity: 'rare',
    condition: (s) => s.perfectCount >= 10,
    xp: 100
  },
  {
    id: 'perfect_50',
    name: 'Perfección',
    description: 'Consigue 50 timings Perfect',
    icon: '🌟',
    rarity: 'epic',
    condition: (s) => s.perfectCount >= 50,
    xp: 300
  },
  {
    id: 'perfect_100',
    name: 'Maestro Perfecto',
    description: 'Consigue 100 timings Perfect',
    icon: '💫',
    rarity: 'legendary',
    condition: (s) => s.perfectCount >= 100,
    xp: 750
  },
  
  // Multi-instrument Achievements
  {
    id: 'two_instruments',
    name: 'Explorador',
    description: 'Toca 2 instrumentos diferentes',
    icon: '🎸',
    rarity: 'common',
    condition: (s) => s.instrumentsPlayed.length >= 2,
    xp: 50
  },
  {
    id: 'four_instruments',
    name: 'Orquesta Completa',
    description: 'Toca 4 instrumentos diferentes',
    icon: '🎭',
    rarity: 'rare',
    condition: (s) => s.instrumentsPlayed.length >= 4,
    xp: 200
  },
  {
    id: 'all_instruments',
    name: 'Maestro Orquestal',
    description: 'Toca todos los instrumentos',
    icon: '🎼',
    rarity: 'legendary',
    condition: (s) => s.instrumentsPlayed.length >= 13,
    xp: 1000
  },
  
  // Songs Completed
  {
    id: 'songs_5',
    name: 'Primer Repertorio',
    description: 'Completa 5 canciones',
    icon: '📚',
    rarity: 'common',
    condition: (s) => s.songsCompleted.length >= 5,
    xp: 100
  },
  {
    id: 'songs_25',
    name: 'Concertista',
    description: 'Completa 25 canciones',
    icon: '🎭',
    rarity: 'rare',
    condition: (s) => s.songsCompleted.length >= 25,
    xp: 300
  },
  {
    id: 'songs_100',
    name: 'Solista',
    description: 'Completa 100 canciones',
    icon: '🌟',
    rarity: 'legendary',
    condition: (s) => s.songsCompleted.length >= 100,
    xp: 1000
  },
  
  // Practice Time
  {
    id: 'practice_1h',
    name: 'Primera Hora',
    description: 'Practica por 1 hora',
    icon: '⏰',
    rarity: 'common',
    condition: (s) => s.practiceTime >= 3600,
    xp: 50
  },
  {
    id: 'practice_10h',
    name: 'Dedicado',
    description: 'Practica por 10 horas',
    icon: '🎪',
    rarity: 'rare',
    condition: (s) => s.practiceTime >= 36000,
    xp: 250
  },
  {
    id: 'practice_100h',
    name: 'Profesional',
    description: 'Practica por 100 horas',
    icon: '🎓',
    rarity: 'legendary',
    condition: (s) => s.practiceTime >= 360000,
    xp: 1000
  },
  
  // Grade Achievements
  {
    id: 'grade_s',
    name: 'Primero de la Clase',
    description: 'Consigue una calificación S',
    icon: '🥇',
    rarity: 'rare',
    condition: (s) => s.totalPlays > 0, // Track separately
    xp: 100
  },
  {
    id: 'grade_s_10',
    name: 'Estrella S',
    description: 'Consigue 10 calificaciones S',
    icon: '⭐🌟',
    rarity: 'epic',
    condition: (s) => s.songsCompleted.length >= 10,
    xp: 500
  }
]

// Level system
export const LEVELS = [
  { level: 1, title: 'Novato', xpRequired: 0 },
  { level: 2, title: 'Estudiante', xpRequired: 100 },
  { level: 3, title: 'Aprendiz', xpRequired: 300 },
  { level: 4, title: 'Practik', xpRequired: 600 },
  { level: 5, title: 'Músico', xpRequired: 1000 },
  { level: 6, title: 'Solista', xpRequired: 2000 },
  { level: 7, title: 'Virtuoso', xpRequired: 4000 },
  { level: 8, title: 'Maestro', xpRequired: 8000 },
  { level: 9, title: 'Leyenda', xpRequired: 15000 },
  { level: 10, title: 'Orquesta Hero', xpRequired: 30000 }
]

export function calculateLevel(totalXP: number): { level: number; title: string; progress: number; nextLevelXP: number } {
  let currentLevel = LEVELS[0]
  let nextLevel = LEVELS[1]
  
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (totalXP >= LEVELS[i].xpRequired) {
      currentLevel = LEVELS[i]
      nextLevel = LEVELS[i + 1] || LEVELS[i]
      break
    }
  }
  
  const progress = nextLevel.xpRequired > currentLevel.xpRequired 
    ? ((totalXP - currentLevel.xpRequired) / (nextLevel.xpRequired - currentLevel.xpRequired)) * 100
    : 100
    
  return {
    level: currentLevel.level,
    title: currentLevel.title,
    progress: Math.min(progress, 100),
    nextLevelXP: nextLevel.xpRequired
  }
}

export function getUnlockedAchievements(stats: PlayerStats): Achievement[] {
  return ACHIEVEMENTS.filter(a => a.condition(stats))
}

export function getLockedAchievements(stats: PlayerStats): Achievement[] {
  return ACHIEVEMENTS.filter(a => !a.condition(stats))
}