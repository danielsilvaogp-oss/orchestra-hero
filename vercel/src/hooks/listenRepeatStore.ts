import { create } from 'zustand'
import { ParsedNote } from '@/lib/musicxml-parser'

interface ListenRepeatState {
  // Mode settings
  listenEnabled: boolean
  repeatEnabled: boolean
  listenCount: number // How many times to play before student plays
  autoProgress: boolean
  
  // Current state
  isListening: boolean
  isPlayingBack: boolean
  currentNoteIndex: number
  waitingForInput: boolean
  
  // Notes for current session
  notes: ParsedNote[] | null
  
  // Audio
  audioContext: AudioContext | null
  oscillator: OscillatorNode | null
  gainNode: GainNode | null
  
  // Actions
  setListenMode: (enabled: boolean) => void
  setRepeatMode: (enabled: boolean) => void
  setListenCount: (count: number) => void
  setNotes: (notes: ParsedNote[]) => void
  initAudio: () => Promise<void>
  playNote: (midi: number, duration: number) => void
  playMelody: (notes: ParsedNote[]) => Promise<void>
  nextNote: () => void
  checkAnswer: (playedMidi: number) => 'correct' | 'incorrect' | 'close'
  reset: () => void
}

export const useListenRepeatStore = create<ListenRepeatState>((set, get) => ({
  listenEnabled: true,
  repeatEnabled: true,
  listenCount: 2,
  autoProgress: true,
  
  isListening: false,
  isPlayingBack: false,
  currentNoteIndex: 0,
  waitingForInput: false,
  
  notes: null,
  
  audioContext: null,
  oscillator: null,
  gainNode: null,
  
  setListenMode: (enabled) => set({ listenEnabled: enabled }),
  setRepeatMode: (enabled) => set({ repeatEnabled: enabled }),
  setListenCount: (count) => set({ listenCount: count }),
  setNotes: (notes) => set({ notes }),
  
  initAudio: async () => {
    if (!get().audioContext) {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const gain = ctx.createGain()
      gain.connect(ctx.destination)
      gain.gain.value = 0.5
      
      set({ audioContext: ctx, gainNode: gain })
    }
  },
  
  midiToFrequency: (midi: number) => 440 * Math.pow(2, (midi - 69) / 12),
  
  playNote: (midi: number, duration: number = 500) => {
    const { audioContext, gainNode, oscillator } = get()
    if (!audioContext || !gainNode) return
    
    // Stop previous note
    if (oscillator) {
      try { oscillator.stop() } catch(e) {}
    }
    
    const osc = audioContext.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = 440 * Math.pow(2, (midi - 69) / 12)
    osc.connect(gainNode)
    
    // Envelope for smooth sound
    gainNode.gain.setValueAtTime(0, audioContext.currentTime)
    gainNode.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + 0.05)
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + duration/1000)
    
    osc.start()
    osc.stop(audioContext.currentTime + duration/1000)
    
    set({ oscillator: osc })
  },
  
  playMelody: async (notes: ParsedNote[]) => {
    const { listenCount } = get()
    
    if (!get().audioContext) {
      await get().initAudio()
    }
    
    set({ isPlayingBack: true, currentNoteIndex: 0, waitingForInput: false, notes })
    
    // Play each note 'listenCount' times
    for (let rep = 0; rep < listenCount; rep++) {
      for (let i = 0; i < notes.length; i++) {
        set({ currentNoteIndex: i, waitingForInput: false })
        
        // Play the note
        get().playNote(notes[i].midi, notes[i].durationMs)
        
        // Wait between notes
        await new Promise(resolve => setTimeout(resolve, notes[i].durationMs + 200))
      }
      
      // Pause between repetitions
      if (rep < listenCount - 1) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }
    
    set({ isPlayingBack: false, waitingForInput: true })
  },
  
  nextNote: () => {
    const { currentNoteIndex, notes, autoProgress } = get()
    if (!notes) return
    if (currentNoteIndex < notes.length - 1) {
      set({ currentNoteIndex: currentNoteIndex + 1, waitingForInput: false })
    } else {
      set({ waitingForInput: false })
    }
  },
  
  checkAnswer: (playedMidi: number) => {
    const { currentNoteIndex, notes } = get()
    if (!notes) return 'incorrect'
    const targetNote = notes[currentNoteIndex]
    
    if (!targetNote) return 'incorrect'
    
    const diff = Math.abs(playedMidi - targetNote.midi)
    
    if (diff === 0) return 'correct'
    if (diff <= 1) return 'close'
    return 'incorrect'
  },
  
  reset: () => set({
    isListening: false,
    isPlayingBack: false,
    currentNoteIndex: 0,
    waitingForInput: false,
    oscillator: null
  })
}))

// Note names for display
export function midiToNoteName(midi: number): string {
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  const octave = Math.floor(midi / 12) - 1
  return `${notes[midi % 12]}${octave}`
}

// Frequency display
export function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12)
}