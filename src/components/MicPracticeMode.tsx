'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMicPracticeStore } from '@/hooks/useMicPracticeStore'
import { ALL_INSTRUMENTS, getInstrumentDisplayInfo } from '@/lib/instrument-keys'

const NOTE_TRAVEL_TIME = 2500

export default function MicPracticeMode() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const [countdown, setCountdown] = useState(3)
  const [repetitionWarning, setRepetitionWarning] = useState(false)
  
  const {
    notes,
    processedNotes,
    gameStartTime,
    isPlaying,
    isListening,
    detectedNote,
    failCount,
    maxFails,
    isRepetitionRequired,
    selectedInstrument,
    startListening,
    stopListening,
    processMiss,
    endGame,
    resetFails,
    checkMicHit
  } = useMicPracticeStore()

  const instrumentLanes = selectedInstrument ? null : null; // No lanes needed for mic-only
  const instrumentConfig = selectedInstrument ? (ALL_INSTRUMENTS as any)[selectedInstrument] : null
  const instrumentColor = instrumentConfig?.color || '#d4af37'

  // Start microphone
  useEffect(() => {
    if (!isListening) {
      startListening().catch(() => {})
    }
    
    return () => {
      stopListening()
    }
  }, [])

  // Show repetition warning
  useEffect(() => {
    if (isRepetitionRequired) {
      setRepetitionWarning(true)
    }
  }, [isRepetitionRequired])

  // Countdown
  useEffect(() => {
    if (!isPlaying || isRepetitionRequired) {
      setCountdown(3)
      return
    }

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isPlaying, isRepetitionRequired])

  // Canvas render
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const render = () => {
      const currentTime = isPlaying && gameStartTime > 0 ? Date.now() - gameStartTime : 0

      // Clear
      ctx.fillStyle = '#0a0a14'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Highway dimensions
      const highwayWidth = canvas.width * 0.5
      const highwayLeft = (canvas.width - highwayWidth) / 2
      const laneWidth = highwayWidth / 4
      const highwayTop = canvas.height * 0.15
      const hitZoneY = canvas.height * 0.85

      // Highway background
      const gradient = ctx.createLinearGradient(0, highwayTop, 0, hitZoneY)
      gradient.addColorStop(0, '#0f0f1f')
      gradient.addColorStop(1, '#1a1a2f')
      ctx.fillStyle = gradient
      ctx.fillRect(highwayLeft, highwayTop, highwayWidth, hitZoneY - highwayTop)

      // Grid
      for (let i = 0; i < 20; i++) {
        const y = highwayTop + (i / 20) * (hitZoneY - highwayTop)
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.1)'
        ctx.beginPath()
        ctx.moveTo(highwayLeft, y)
        ctx.lineTo(highwayLeft + highwayWidth, y)
        ctx.stroke()
      }

      // Simple hit zone - just a line
      for (let i = 0; i < 4; i++) {
        const x = highwayLeft + i * laneWidth
        ctx.fillStyle = 'rgba(68, 68, 170, 0.3)'
        ctx.beginPath()
        ctx.roundRect(x + 5, hitZoneY - 8, laneWidth - 10, 16, 8)
        ctx.fill()
      }

      // Hit line
      ctx.strokeStyle = instrumentColor
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(highwayLeft, hitZoneY)
      ctx.lineTo(highwayLeft + highwayWidth, hitZoneY)
      ctx.stroke()

      // Draw notes
      notes.forEach((note, index) => {
        if (processedNotes.has(index)) return

        const timeUntilHit = note.startMs - currentTime
        if (timeUntilHit > NOTE_TRAVEL_TIME || timeUntilHit < -300) return

        const progress = 1 - (timeUntilHit / NOTE_TRAVEL_TIME)
        const y = highwayTop + progress * (hitZoneY - highwayTop - 40)

        // Calculate x based on note's original lane or spread evenly
        const lane = index % 4
        const x = highwayLeft + lane * laneWidth + laneWidth / 2

        const noteWidth = laneWidth - 20
        const noteHeight = 40

        // Check if playing correct note (matches mic detected note)
        const currentHitNoteIndex = useMicPracticeStore.getState().currentHitNote
        const isHit = index === currentHitNoteIndex
        
        const isPlayingCorrect = detectedNote && Math.abs(detectedNote.midi - note.midi) <= 2

        let noteColor = instrumentColor
        if (isHit) noteColor = '#33ff66'
        else if (isPlayingCorrect && timeUntilHit < 300 && timeUntilHit > -300) {
          noteColor = '#33ff66' // Green when matching
        }

        ctx.fillStyle = noteColor
        ctx.beginPath()
        ctx.roundRect(x - noteWidth / 2, y, noteWidth, noteHeight, 10)
        ctx.fill()

        ctx.strokeStyle = isHit ? '#ffffff' : 'rgba(255,255,255,0.5)'
        ctx.lineWidth = isHit ? 3 : 2
        ctx.stroke()

        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 14px Inter'
        ctx.textAlign = 'center'
        ctx.fillText(note.pitch, x, y + noteHeight / 2 + 5)
      })

      // Detected note indicator
      if (detectedNote && isListening) {
        const noteName = getNoteName(detectedNote.midi)
        const frequency = detectedNote.frequency.toFixed(1)
        
        ctx.fillStyle = isRepetitionRequired ? '#ff3333' : '#33ff66'
        ctx.font = 'bold 24px Inter'
        ctx.textAlign = 'center'
        ctx.fillText(`🎤 ${noteName}`, canvas.width / 2, 50)
        
        // Frequency display
        ctx.fillStyle = 'rgba(255,255,255,0.3)'
        ctx.font = '12px Inter'
        ctx.fillText(`${frequency} Hz`, canvas.width / 2, 70)
      }

      // Fail counter
      ctx.fillStyle = failCount > 0 ? '#ff3333' : '#666'
      ctx.font = 'bold 14px Inter'
      ctx.textAlign = 'right'
      ctx.fillText(`❌ ${failCount}/${maxFails}`, highwayLeft + highwayWidth, 40)

      // Check for missed notes
      if (isPlaying && gameStartTime > 0) {
        const currentTime = Date.now() - gameStartTime
        notes.forEach((note, index) => {
          if (processedNotes.has(index)) return
          if (currentTime > note.startMs + 400) {
            processMiss(index)
          }
        })
      }

      // End game check
      if (isPlaying && notes.length > 0) {
        const lastNote = notes[notes.length - 1]
        if (currentTime > lastNote.startMs + 3000) {
          endGame()
          return
        }
      }

      animationRef.current = requestAnimationFrame(render)
    }

    render()

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [notes, processedNotes, gameStartTime, isPlaying, isListening, detectedNote, isRepetitionRequired, failCount, maxFails, instrumentColor, processMiss, endGame])

  function getNoteName(midi: number): string {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    const octave = Math.floor(midi / 12) - 1
    return `${notes[midi % 12]}${octave}`
  }

  // Countdown overlay
  if (countdown > 0 && !isRepetitionRequired) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-orchestra-dark z-50">
        <motion.div
          key={countdown}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 1.5, opacity: 0 }}
          className="text-orchestra-gold font-display text-[200px] font-bold text-gold-glow"
        >
          {countdown}
        </motion.div>
      </div>
    )
  }

  // Repetition required
  if (isRepetitionRequired) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-red-900/90 z-50">
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="text-center"
        >
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="font-display text-4xl text-white mb-4">Repetir</h2>
          <p className="text-white/70 mb-8">Has fallado {maxFails} veces</p>
          <button
            onClick={() => {
              resetFails()
              useMicPracticeStore.getState().startGame()
            }}
            className="btn-gold text-xl px-12"
          >
            REPETIR DESDE EL INICIO
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <canvas ref={canvasRef} className="game-canvas" />

      {/* HUD */}
      <div className="absolute top-4 left-0 right-0 flex justify-between px-8 pointer-events-none">
        <div className="text-orchestra-gold font-display text-3xl">
          {useMicPracticeStore.getState().score.toLocaleString()}
        </div>
        <div className="flex gap-6">
          <div className="text-green-400 font-display text-2xl">
            Combo: {useMicPracticeStore.getState().combo}
          </div>
          <div className="text-orchestra-blue font-display text-2xl">
            Max: {useMicPracticeStore.getState().maxStreak}
          </div>
        </div>
      </div>

      {/* Instrument indicator */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
        <div 
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: instrumentColor }}
        />
        <span className="text-white/80 text-sm font-medium">
          {instrumentConfig?.name || 'Instrument'}
        </span>
      </div>

      {/* Mic status */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {isListening ? (
          <div className="flex items-center gap-2 text-green-400">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Micrófono activo - toca tu instrumento
          </div>
        ) : (
          <div className="text-white/40 text-sm">Iniciando micrófono...</div>
        )}
      </div>

      {/* Exit button */}
      <button
        onClick={() => endGame()}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/30 hover:text-white text-sm transition-colors"
      >
        Presiona ESC o aquí para salir
      </button>

      {/* ESC key handler */}
      <KeyHandler />
    </div>
  )
}

// Simple key handler for ESC only
function KeyHandler() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        useMicPracticeStore.getState().endGame()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
  
  return null
}