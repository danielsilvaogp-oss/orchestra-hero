import { create } from 'zustand'
import { ParsedNote } from '@/lib/musicxml-parser'

export type GameState = 'menu' | 'songs' | 'playing' | 'results' | 'practice' | 'achievements' | 'listenRepeat'
export type HitTiming = 'perfect' | 'great' | 'good' | 'ok' | 'miss'

interface GameStore {
  // State
  screen: GameState
  songs: any[]
  selectedSong: any | null
  selectedInstrument: string | null
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  
  // Game
  notes: ParsedNote[]
  processedNotes: Set<number>
  customMusicXML: string | null
  customMetadata: any
  gameStartTime: number
  isPlaying: boolean
  isPaused: boolean
  
  // Scoring
  score: number
  combo: number
  maxCombo: number
  currentStreak: number
  maxStreak: number
  hits: Record<HitTiming, number>
  
  // Audio
  audioContext: AudioContext | null
  audioBuffer: AudioBuffer | null
  volume: number
  
  // Actions
  setScreen: (screen: GameState) => void
  setSongs: (songs: any[]) => void
  selectSong: (song: any) => void
  selectInstrument: (instrument: string | null) => void
  setDifficulty: (difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert') => void
  setCustomMusicXML: (xml: string | null, metadata: any) => void
  
  // Game actions
  setNotes: (notes: ParsedNote[]) => void
  startGame: () => void
  endGame: () => void
  pauseGame: () => void
  resumeGame: () => void
  processHit: (timing: HitTiming) => void
  processMiss: (noteIndex: number) => void
  resetGame: () => void
  
  // Audio
  initAudio: () => Promise<void>
  loadAudio: (url: string) => Promise<void>
  playAudio: () => void
  stopAudio: () => void
  setVolume: (volume: number) => void
  
  // Results
  getResults: () => {
    score: number
    accuracy: number
    grade: string
    maxCombo: number
    maxStreak: number
    hits: Record<HitTiming, number>
    totalNotes: number
  }
}

const TIMING_WINDOWS = {
  perfect: 30,
  great: 60,
  good: 100,
  ok: 150,
  miss: 200
}

const POINTS: Record<HitTiming, number> = {
  perfect: 100,
  great: 75,
  good: 50,
  ok: 25,
  miss: 0
}

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial state
  screen: 'menu',
  songs: [],
  selectedSong: null,
  selectedInstrument: null,
  difficulty: 'beginner',
  
  notes: [],
  processedNotes: new Set(),
  gameStartTime: 0,
  isPlaying: false,
  isPaused: false,
  customMusicXML: null,
  customMetadata: null,
  
  score: 0,
  combo: 0,
  maxCombo: 0,
  currentStreak: 0,
  maxStreak: 0,
  hits: { perfect: 0, great: 0, good: 0, ok: 0, miss: 0 },
  
  audioContext: null,
  audioBuffer: null,
  volume: 80,
  
  // Actions
  setScreen: (screen) => set({ screen }),
  
  setSongs: (songs) => set({ songs }),
  
  selectSong: (song) => set({ selectedSong: song }),
  
  selectInstrument: (instrument) => set({ selectedInstrument: instrument }),
  
  setDifficulty: (difficulty) => set({ difficulty }),
  
  setCustomMusicXML: (xml, metadata) => set({ customMusicXML: xml, customMetadata: metadata }),
  
  setNotes: (notes) => set({ notes, processedNotes: new Set() }),
  
  startGame: () => set({
    isPlaying: true,
    isPaused: false,
    gameStartTime: Date.now(),
    score: 0,
    combo: 0,
    maxCombo: 0,
    currentStreak: 0,
    maxStreak: 0,
    hits: { perfect: 0, great: 0, good: 0, ok: 0, miss: 0 },
    processedNotes: new Set()
  }),
  
  endGame: () => set({ isPlaying: false, screen: 'results' }),
  
  pauseGame: () => set({ isPaused: true }),
  
  resumeGame: () => set({ isPaused: false }),
  
  processHit: (timing) => {
    const state = get()
    
    if (timing === 'miss') {
      set({
        combo: 0,
        currentStreak: 0,
        hits: { ...state.hits, miss: state.hits.miss + 1 }
      })
    } else {
      const multiplier = state.combo >= 50 ? 4 : state.combo >= 30 ? 3 : state.combo >= 10 ? 2 : 1
      const newScore = state.score + POINTS[timing] * multiplier
      const newCombo = state.combo + 1
      const newStreak = state.currentStreak + 1
      
      set({
        score: newScore,
        combo: newCombo,
        maxCombo: Math.max(state.maxCombo, newCombo),
        currentStreak: newStreak,
        maxStreak: Math.max(state.maxStreak, newStreak),
        hits: { ...state.hits, [timing]: state.hits[timing] + 1 }
      })
    }
  },
  
  processMiss: (noteIndex) => {
    const state = get()
    const newProcessed = new Set(state.processedNotes)
    newProcessed.add(noteIndex)
    
    set({
      processedNotes: newProcessed,
      combo: 0,
      currentStreak: 0,
      hits: { ...state.hits, miss: state.hits.miss + 1 }
    })
  },
  
  resetGame: () => set({
    notes: [],
    processedNotes: new Set(),
    gameStartTime: 0,
    isPlaying: false,
    isPaused: false,
    score: 0,
    combo: 0,
    maxCombo: 0,
    currentStreak: 0,
    maxStreak: 0,
    hits: { perfect: 0, great: 0, good: 0, ok: 0, miss: 0 }
  }),
  
  // Audio
  initAudio: async () => {
    if (!get().audioContext) {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      set({ audioContext: ctx })
    }
  },
  
  loadAudio: async (url) => {
    const state = get()
    if (!state.audioContext) {
      await state.initAudio()
    }
    
    try {
      const response = await fetch(url)
      const arrayBuffer = await response.arrayBuffer()
      const buffer = await state.audioContext!.decodeAudioData(arrayBuffer)
      set({ audioBuffer: buffer })
    } catch (error) {
      console.warn('Failed to load audio:', error)
    }
  },
  
  playAudio: () => {
    const state = get()
    if (!state.audioContext || !state.audioBuffer) return
    
    const source = state.audioContext.createBufferSource()
    source.buffer = state.audioBuffer
    source.connect(state.audioContext.destination)
    source.start(0)
  },
  
  stopAudio: () => {
    const state = get()
    if (state.audioContext) {
      state.audioContext.suspend()
    }
  },
  
  setVolume: (volume) => set({ volume }),
  
  getResults: () => {
    const state = get()
    const totalNotes = state.notes.length
    const totalHits = Object.values(state.hits).reduce((a, b) => a + b, 0)
    
    const weightedHits = (
      state.hits.perfect * 100 +
      state.hits.great * 75 +
      state.hits.good * 50 +
      state.hits.ok * 25
    ) / 100
    
    const accuracy = totalNotes > 0 ? (weightedHits / totalNotes) * 100 : 0
    
    let grade = 'F'
    if (accuracy >= 98) grade = 'S'
    else if (accuracy >= 95) grade = 'A'
    else if (accuracy >= 90) grade = 'B'
    else if (accuracy >= 80) grade = 'C'
    else if (accuracy >= 70) grade = 'D'
    
    return {
      score: state.score,
      accuracy,
      grade,
      maxCombo: state.maxCombo,
      maxStreak: state.maxStreak,
      hits: state.hits,
      totalNotes
    }
  }
}))