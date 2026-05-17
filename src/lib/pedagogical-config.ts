// Educational Game Configuration for Music Trainer
// Adaptable for different instruments and age groups

export interface GameMode {
  id: string
  name: string
  description: string
  icon: string
  showFingering: boolean
  showNoteName: boolean
  showPosition: boolean
  slowMode: boolean
  colorTheme: string
}

export const GAME_MODES: Record<string, GameMode> = {
  // 🎵 Learning Mode - Shows everything, slower speed
  learn: {
    id: 'learn',
    name: 'Aprender',
    description: 'Modo educativo con ayuda visual',
    icon: '📚',
    showFingering: true,
    showNoteName: true,
    showPosition: true,
    slowMode: true,
    colorTheme: 'rainbow'
  },
  
  // 🎮 Practice Mode - Standard game with some help
  practice: {
    id: 'practice',
    name: 'Practicar',
    description: 'Practica con pistas visuales',
    icon: '🎯',
    showFingering: true,
    showNoteName: true,
    showPosition: false,
    slowMode: false,
    colorTheme: 'gold'
  },
  
  // 🏆 Challenge Mode - Full game, no help
  challenge: {
    id: 'challenge',
    name: 'Desafío',
    description: 'Modo completo sin ayuda',
    icon: '🏆',
    showFingering: false,
    showNoteName: false,
    showPosition: false,
    slowMode: false,
    colorTheme: 'red'
  },
  
  // 🔊 Listen Mode - Hear the note first, then play
  listen: {
    id: 'listen',
    name: 'Escuchar',
    description: 'Escucha y luego toca',
    icon: '👂',
    showFingering: true,
    showNoteName: true,
    showPosition: true,
    slowMode: true,
    colorTheme: 'blue'
  }
}

// Visual themes for different moods
export const VISUAL_THEMES = {
  rainbow: {
    background: 'linear-gradient(180deg, #1a0a2e 0%, #0a0a1a 100%)',
    noteColors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dfe6e9'],
    hitZone: '#9b59b6',
    effect: 'rainbow'
  },
  gold: {
    background: 'linear-gradient(180deg, #1a1520 0%, #0a0a14 100%)',
    noteColors: ['#d4af37', '#f0d060', '#c9a227', '#aa8a1a'],
    hitZone: '#d4af37',
    effect: 'glow'
  },
  red: {
    background: 'linear-gradient(180deg, #2a0a0a 0%, #0a0505 100%)',
    noteColors: ['#ff4444', '#ff6666', '#ff8888', '#ffaaaa'],
    hitZone: '#ff3333',
    effect: 'flame'
  },
  blue: {
    background: 'linear-gradient(180deg, #0a1a2e 0%, #050a14 100%)',
    noteColors: ['#3399ff', '#66b3ff', '#99ccff', '#cce0ff'],
    hitZone: '#3399ff',
    effect: 'water'
  },
  forest: {
    background: 'linear-gradient(180deg, #0a2a10 0%, #050a05 100%)',
    noteColors: ['#2ecc71', '#27ae60', '#1e8449', '#16a085'],
    hitZone: '#2ecc71',
    effect: 'sparkle'
  }
}

// Age group configurations
export const AGE_CONFIGS = {
  '6-8': {
    noteSpeed: 0.6,
    hitWindow: 200,
    showFingering: true,
    showNoteName: true,
    largeNotes: true,
    simpleFeedback: true,
    encouragement: true,
    animatedHelper: true
  },
  '9-11': {
    noteSpeed: 0.8,
    hitWindow: 150,
    showFingering: true,
    showNoteName: true,
    largeNotes: false,
    simpleFeedback: false,
    encouragement: true,
    animatedHelper: false
  },
  '12+': {
    noteSpeed: 1.0,
    hitWindow: 100,
    showFingering: false,
    showNoteName: false,
    largeNotes: false,
    simpleFeedback: false,
    encouragement: false,
    animatedHelper: false
  }
}

// Instrument-specific visual behaviors
export const INSTRUMENT_BEHAVIORS = {
  strings: {
    vibrationEffect: true,
    showBowing: true,
    showFingerPositions: true,
    noteSize: 'medium',
    tailEffect: true
  },
  winds: {
    vibrationEffect: false,
    showBreathIndicator: true,
    showFingerPositions: true,
    noteSize: 'small',
    tailEffect: false
  },
  percussion: {
    vibrationEffect: true,
    showHitEffect: true,
    showStickMovement: true,
    noteSize: 'large',
    tailEffect: false
  },
  keyboard: {
    vibrationEffect: false,
    showKeyPress: true,
    showFingerPositions: false,
    noteSize: 'medium',
    tailEffect: false
  }
}

// Feedback messages for children
export const ENCOURAGEMENT_MESSAGES = {
  perfect: [
    '¡Excelente! 🌟',
    '¡Perfecto! ⭐',
    '¡Maravilloso! ✨',
    '¡Eres un campeón! 🏆'
  ],
  great: [
    '¡Muy bien! 👍',
    '¡Buen trabajo! 💪',
    '¡Sigue así! 🎵'
  ],
  good: [
    '¡Bien hecho! ✓',
    '¡Casi lo logras! 💫'
  ],
  ok: [
    '¡Sigue practicando! 🎯',
    '¡Lo estás logrando! 🌱'
  ],
  miss: [
    '¡Intenta de nuevo! 💪',
    '¡Tú puedes! ⭐',
    '¡No te rindas! 🌈'
  ]
}

// Educational helper animations
export const HELPER_CHARACTERS = {
  musical_note: { emoji: '🎵', name: 'Nota' },
  star: { emoji: '⭐', name: 'Estrella' },
  rocket: { emoji: '🚀', name: 'Cohete' },
  rainbow: { emoji: '🌈', name: 'Arcoíris' },
  trophy: { emoji: '🏆', name: 'Trofeo' }
}

export function getEncouragement(timing: string): string {
  const messages = ENCOURAGEMENT_MESSAGES[timing as keyof typeof ENCOURAGEMENT_MESSAGES]
  if (!messages) return '¡Sigue intentando!'
  return messages[Math.floor(Math.random() * messages.length)]
}

export function getNoteSpeed(baseSpeed: number, ageGroup: string): number {
  const config = AGE_CONFIGS[ageGroup as keyof typeof AGE_CONFIGS]
  return baseSpeed * (config?.noteSpeed || 1)
}

export function getHitWindow(baseWindow: number, ageGroup: string): number {
  const config = AGE_CONFIGS[ageGroup as keyof typeof AGE_CONFIGS]
  return baseWindow * (config?.hitWindow || 100) / 100
}