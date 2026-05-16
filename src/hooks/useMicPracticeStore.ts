import { create } from 'zustand'
import { ParsedNote } from '@/lib/musicxml-parser'
import { getAudioDetector, DetectedNote } from '@/lib/audio-detector'

export type PracticeMode = 'keyboard' | 'microphone'
export type HitTiming = 'perfect' | 'great' | 'good' | 'ok' | 'miss'

interface MicPracticeStore {
  // Mode
  practiceMode: PracticeMode
  setPracticeMode: (mode: PracticeMode) => void
  
  // Audio detection
  isListening: boolean
  startListening: () => Promise<boolean>
  stopListening: () => void
  detectedNote: DetectedNote | null
  
  // Fail system
  failCount: number
  maxFails: number
  isRepetitionRequired: boolean
  incrementFails: () => void
  resetFails: () => void
  
  // Game state
  gameStartTime: number
  isPlaying: boolean
  selectedInstrument: string | null
  notes: ParsedNote[]
  processedNotes: Set<number>
  currentHitNote: number | null
  
  // Scoring
  score: number
  combo: number
  maxCombo: number
  currentStreak: number
  maxStreak: number
  hits: Record<HitTiming, number>
  
  // Actions
  setNotes: (notes: ParsedNote[]) => void
  checkMicHit: () => void
  processMiss: (noteIndex: number) => void
  resetGame: () => void
  startGame: () => void
  endGame: () => void
  getResults: () => any
}

const TIMING_WINDOWS = {
  perfect: 50,   // ms - slightly wider for live playing
  great: 100,
  good: 150,
  ok: 250,
  miss: 400
}

const POINTS: Record<HitTiming, number> = {
  perfect: 100,
  great: 75,
  good: 50,
  ok: 25,
  miss: 0
}

export const useMicPracticeStore = create<MicPracticeStore>((set, get) => ({
  // Mode
  practiceMode: 'keyboard',
  setPracticeMode: (mode) => set({ practiceMode: mode }),
  
  // Audio detection
  isListening: false,
  detectedNote: null,
  
  startListening: async () => {
    const detector = getAudioDetector()
    const success = await detector.init()
    if (success) {
      set({ isListening: true })
      startDetectionLoop()
    }
    return success
  },
  
  stopListening: () => {
    const detector = getAudioDetector()
    detector.stop()
    set({ isListening: false, detectedNote: null })
  },
  
  detectNote: () => {
    if (!get().isListening) return null
    
    const detector = getAudioDetector()
    const note = detector.detectNote()
    if (note) {
      set({ detectedNote: note })
    }
    return note
  },
  
  // Fail system
  failCount: 0,
  maxFails: 2,
  isRepetitionRequired: false,
  
  incrementFails: () => {
    const state = get()
    const newCount = state.failCount + 1
    const isRepetition = newCount >= state.maxFails
    
    set({ 
      failCount: newCount,
      isRepetitionRequired: isRepetition
    })
  },
  
  resetFails: () => set({ 
    failCount: 0, 
    isRepetitionRequired: false 
  }),
  
  // Game state
  gameStartTime: 0,
  isPlaying: false,
  selectedInstrument: null,
  notes: [],
  processedNotes: new Set(),
  currentHitNote: null,
  
  setNotes: (notes) => set({ 
    notes, 
    processedNotes: new Set(),
    failCount: 0,
    isRepetitionRequired: false 
  }),
  
  checkMicHit: () => {
    const state = get()
    if (!state.isListening || state.gameStartTime === 0) return
    
    const detector = getAudioDetector()
    const detectedNote = detector.detectNote()
    
    if (!detectedNote) return
    
    const currentTime = Date.now() - state.gameStartTime
    
    // Find matching note
    let closestNote: ParsedNote | null = null
    let closestIndex = -1
    let closestDiff = Infinity

    state.notes.forEach((note, index) => {
      if (state.processedNotes.has(index)) return
      
      // Check if detected note matches (within +/- 1 semitone for tolerance)
      const midiDiff = Math.abs(detectedNote.midi - note.midi)
      if (midiDiff > 2) return
      
      const timeDiff = Math.abs(currentTime - note.startMs)
      if (timeDiff < closestDiff && timeDiff <= TIMING_WINDOWS.miss) {
        closestDiff = timeDiff
        closestNote = note
        closestIndex = index
      }
    })

    if (closestNote && closestIndex >= 0) {
      // Mark as processed
      const newProcessed = new Set(state.processedNotes)
      newProcessed.add(closestIndex)
      
      // Determine timing
      let timing: HitTiming = 'miss'
      if (closestDiff <= TIMING_WINDOWS.perfect) timing = 'perfect'
      else if (closestDiff <= TIMING_WINDOWS.great) timing = 'great'
      else if (closestDiff <= TIMING_WINDOWS.good) timing = 'good'
      else if (closestDiff <= TIMING_WINDOWS.ok) timing = 'ok'
      
      // Process hit
      if (timing === 'miss') {
        state.incrementFails()
      } else {
        state.resetFails()
        
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
          hits: { ...state.hits, [timing]: state.hits[timing] + 1 },
          processedNotes: newProcessed,
          currentHitNote: closestIndex
        })
        
        // Clear highlight after delay
        setTimeout(() => {
          set({ currentHitNote: null })
        }, 200)
      }
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
    
    // Check if two consecutive misses
    state.incrementFails()
  },
  
  startGame: () => set({
    gameStartTime: Date.now(),
    isPlaying: true,
    score: 0,
    combo: 0,
    maxCombo: 0,
    currentStreak: 0,
    maxStreak: 0,
    hits: { perfect: 0, great: 0, good: 0, ok: 0, miss: 0 },
    processedNotes: new Set(),
    failCount: 0,
    isRepetitionRequired: false
  }),

  endGame: () => set({
    isPlaying: false,
    isListening: false
  }),
  
  resetGame: () => set({
    notes: [],
    processedNotes: new Set(),
    gameStartTime: 0,
    isPlaying: false,
    selectedInstrument: null,
    score: 0,
    combo: 0,
    maxCombo: 0,
    currentStreak: 0,
    maxStreak: 0,
    hits: { perfect: 0, great: 0, good: 0, ok: 0, miss: 0 },
    failCount: 0,
    isRepetitionRequired: false,
    detectedNote: null
  }),
  
  getResults: () => {
    const state = get()
    const totalNotes = state.notes.length
    
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
      totalNotes,
      failCount: state.failCount
    }
  }
}))

// Detection loop
function startDetectionLoop() {
  const loop = () => {
    const state = useMicPracticeStore.getState()
    if (state.isListening && state.gameStartTime > 0) {
      state.checkMicHit()
    }
    requestAnimationFrame(loop)
  }
  loop()
}