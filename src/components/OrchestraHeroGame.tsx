'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMicPracticeStore } from '@/hooks/useMicPracticeStore'
import { ALL_INSTRUMENTS } from '@/lib/instrument-keys'
import { 
  GAME_MODES, 
  VISUAL_THEMES, 
  AGE_CONFIGS, 
  getEncouragement,
  HELPER_CHARACTERS
} from '@/lib/pedagogical-config'

interface OrchestraHeroGameProps {
  onClose?: () => void
}

const LANES = 4
const BASE_TRAVEL_TIME = 3000

export default function OrchestraHeroGame({ onClose }: OrchestraHeroGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const [countdown, setCountdown] = useState(3)
  const [showEncouragement, setShowEncouragement] = useState<string | null>(null)
  const [helperCharacter, setHelperCharacter] = useState<keyof typeof HELPER_CHARACTERS>('musical_note')
  
  // Game settings
  const [gameMode, setGameMode] = useState<string>('learn')
  const [ageGroup, setAgeGroup] = useState<string>('6-8')
  const [selectedTrack, setSelectedTrack] = useState(0)
  
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
    score,
    combo,
    maxStreak,
    hits
  } = useMicPracticeStore()

  const instrumentConfig = selectedInstrument ? (ALL_INSTRUMENTS as any)[selectedInstrument] : null
  const currentMode = GAME_MODES[gameMode]
  const currentTheme = (VISUAL_THEMES as any)[currentMode?.colorTheme || 'gold']
  const ageConfig = AGE_CONFIGS[ageGroup]

  // Calculate travel time based on age and mode
  const travelTime = BASE_TRAVEL_TIME * (currentMode?.slowMode ? 1.5 : 1) / (ageConfig?.noteSpeed || 1)
  const hitWindow = ageConfig?.hitWindow || 150

  // Start microphone
  useEffect(() => {
    if (!isListening) {
      startListening().catch(() => {})
    }
    return () => stopListening()
  }, [])

  // Show encouragement on hits
  useEffect(() => {
    const combo = useMicPracticeStore.getState().combo
    const lastTiming = Object.entries(useMicPracticeStore.getState().hits)
      .filter(([k]) => k !== 'miss')
      .sort((a, b) => b[1] - a[1])[0]
    
    if (lastTiming && lastTiming[1] > 0) {
      const msg = getEncouragement(lastTiming[0])
      setShowEncouragement(msg)
      
      // Change helper character based on combo
      if (combo >= 30) setHelperCharacter('trophy')
      else if (combo >= 10) setHelperCharacter('star')
      else if (combo >= 5) setHelperCharacter('rocket')
      
      setTimeout(() => setShowEncouragement(null), 1500)
    }
  }, [hits])

  // Countdown
  useEffect(() => {
    if (!isPlaying || isRepetitionRequired) {
      setCountdown(3)
      return
    }

    const interval = setInterval(() => {
      setCountdown(prev => prev <= 1 ? 0 : prev - 1)
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
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2

      // Clear with theme background
      if (currentTheme.background.includes('gradient')) {
        const grad = ctx.createLinearGradient(0, 0, 0, canvas.height)
        const colors = currentTheme.background.match(/#[0-9a-fA-F]{6}/g) || ['#0a0a14', '#1a1a2e']
        grad.addColorStop(0, colors[0])
        grad.addColorStop(1, colors[1] || colors[0])
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }

      // Draw highway (Guitar Hero style perspective)
      const highwayWidth = canvas.width * 0.6
      const highwayLeft = (canvas.width - highwayWidth) / 2
      const highwayTop = canvas.height * 0.1
      const hitZoneY = canvas.height * 0.85

      // Highway with perspective
      ctx.save()
      ctx.beginPath()
      ctx.moveTo(highwayLeft - 100, highwayTop - 50)
      ctx.lineTo(highwayLeft + highwayWidth + 100, highwayTop - 50)
      ctx.lineTo(highwayLeft + highwayWidth, hitZoneY)
      ctx.lineTo(highwayLeft, hitZoneY)
      ctx.closePath()
      
      const highwayGrad = ctx.createLinearGradient(0, highwayTop, 0, hitZoneY)
      highwayGrad.addColorStop(0, '#1a1a2e')
      highwayGrad.addColorStop(1, '#2a2a4e')
      ctx.fillStyle = highwayGrad
      ctx.fill()

      // Lane dividers with perspective
      for (let i = 0; i <= LANES; i++) {
        const topX = highwayLeft + (i / LANES) * highwayWidth - 100 + (i * 20)
        const bottomX = highwayLeft + (i / LANES) * highwayWidth
        
        ctx.strokeStyle = i > 0 && i < LANES ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.4)'
        ctx.lineWidth = i > 0 && i < LANES ? 2 : 3
        ctx.beginPath()
        ctx.moveTo(topX, highwayTop - 50)
        ctx.lineTo(bottomX, hitZoneY)
        ctx.stroke()
      }

      // Scrolling grid effect
      const scrollOffset = (currentTime / 50) % 50
      for (let i = 0; i < 30; i++) {
        const y = highwayTop + ((i * 50 + scrollOffset) % (hitZoneY - highwayTop))
        ctx.strokeStyle = `rgba(212, 175, 55, ${0.1 + (i / 30) * 0.2})`
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(highwayLeft - 50, y)
        ctx.lineTo(highwayLeft + highwayWidth + 50, y)
        ctx.stroke()
      }

      // Hit zone (glow effect)
      ctx.shadowBlur = 20
      ctx.shadowColor = currentTheme.hitZone
      ctx.fillStyle = currentTheme.hitZone + '40'
      ctx.fillRect(highwayLeft, hitZoneY - 5, highwayWidth, 10)
      ctx.shadowBlur = 0

      // Hit line
      ctx.strokeStyle = currentTheme.hitZone
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.moveTo(highwayLeft, hitZoneY)
      ctx.lineTo(highwayLeft + highwayWidth, hitZoneY)
      ctx.stroke()

      // Draw notes
      notes.forEach((note, index) => {
        if (processedNotes.has(index)) return

        const timeUntilHit = note.startMs - currentTime
        if (timeUntilHit > travelTime || timeUntilHit < -300) return

        // Perspective calculation
        const progress = 1 - (timeUntilHit / travelTime)
        const scale = 0.3 + (progress * 0.7)
        
        const laneWidth = highwayWidth / LANES
        const lane = index % LANES
        const perspectiveFactor = 1 - (progress * 0.3)
        
        const topX = highwayLeft + (lane / LANES) * highwayWidth - 100 + (lane * 20)
        const bottomX = highwayLeft + (lane / LANES) * highwayWidth + laneWidth / 2
        const x = topX + (bottomX - topX) * progress
        
        const baseY = highwayTop + progress * (hitZoneY - highwayTop - 50)
        const y = baseY - (progress * 30)

        const noteWidth = (laneWidth - 30) * scale
        const noteHeight = 45 * scale

        // Check if matching detected note
        const currentHitNoteIndex = useMicPracticeStore.getState().currentHitNote
        const isHit = index === currentHitNoteIndex
        
        const isPlayingCorrect = detectedNote && 
          Math.abs(detectedNote.midi - note.midi) <= 2 &&
          timeUntilHit < 300 && timeUntilHit > -300

        // Note color based on theme
        const colorIndex = index % currentTheme.noteColors.length
        let noteColor = currentTheme.noteColors[colorIndex]
        if (isHit || isPlayingCorrect) {
          noteColor = '#33ff66' // Green for correct
        }

        // Draw note with glow
        ctx.shadowBlur = isHit ? 30 : 10
        ctx.shadowColor = noteColor
        
        ctx.fillStyle = noteColor
        ctx.beginPath()
        ctx.roundRect(x - noteWidth / 2, y, noteWidth, noteHeight, 8 * scale)
        ctx.fill()
        
        ctx.shadowBlur = 0
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 2 * scale
        ctx.stroke()

        // Show note name (if mode allows)
        if (currentMode?.showNoteName || ageConfig?.showNoteName) {
          ctx.fillStyle = '#ffffff'
          ctx.font = `bold ${16 * scale}px Inter`
          ctx.textAlign = 'center'
          ctx.fillText(note.pitch, x, y + noteHeight / 2 + 5 * scale)
        }

        // Show fingering (if mode allows)
        if ((currentMode?.showFingering || ageConfig?.showFingering) && note.fingering) {
          ctx.fillStyle = 'rgba(255,255,255,0.7)'
          ctx.font = `${10 * scale}px Inter`
          ctx.textAlign = 'center'
          ctx.fillText(`(${note.fingering})`, x, y + noteHeight + 12 * scale)
        }

        // Trail effect for strings
        if (instrumentConfig?.type === 'strings') {
          ctx.globalAlpha = 0.3
          for (let t = 1; t <= 3; t++) {
            const trailY = y + t * 20 * scale
            ctx.fillStyle = noteColor
            ctx.beginPath()
            ctx.roundRect(x - noteWidth / 2, trailY, noteWidth, 5 * scale, 2)
            ctx.fill()
          }
          ctx.globalAlpha = 1
        }
      })

      // Detected note display
      if (detectedNote && isListening) {
        const noteName = getNoteName(detectedNote.midi)
        
        // Big centered note indicator
        ctx.fillStyle = isRepetitionRequired ? '#ff3333' : '#33ff66'
        ctx.font = 'bold 32px Inter'
        ctx.textAlign = 'center'
        ctx.shadowBlur = 20
        ctx.shadowColor = isRepetitionRequired ? '#ff3333' : '#33ff66'
        ctx.fillText(`🎤 ${noteName}`, centerX, 60)
        ctx.shadowBlur = 0

        // Frequency display
        ctx.fillStyle = 'rgba(255,255,255,0.5)'
        ctx.font = '14px Inter'
        ctx.fillText(`${detectedNote.frequency.toFixed(0)} Hz`, centerX, 85)
      }

      // Fail counter with animation
      if (failCount > 0) {
        ctx.fillStyle = '#ff3333'
        ctx.font = 'bold 18px Inter'
        ctx.textAlign = 'right'
        ctx.fillText(`❌ ${failCount}/${maxFails}`, highwayLeft + highwayWidth - 20, 40)
      }

      // Check for missed notes
      if (isPlaying && gameStartTime > 0) {
        const currentTime = Date.now() - gameStartTime
        notes.forEach((note, index) => {
          if (processedNotes.has(index)) return
          if (currentTime > note.startMs + hitWindow) {
            processMiss(index)
          }
        })
      }

      // Check if game ended
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
  }, [notes, processedNotes, gameStartTime, isPlaying, isListening, detectedNote, 
      isRepetitionRequired, failCount, maxFails, currentMode, ageConfig, 
      instrumentConfig, travelTime, hitWindow, processMiss, endGame])

  function getNoteName(midi: number): string {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    const octave = Math.floor(midi / 12) - 1
    return `${notes[midi % 12]}${octave}`
  }

  // ESC handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') endGame()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Countdown
  if (countdown > 0 && !isRepetitionRequired) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50" 
        style={{ background: currentTheme.background.includes('gradient') ? undefined : '#0a0a14' }}>
        {currentTheme.background.includes('gradient') && (
          <div className="absolute inset-0" style={{ 
            background: currentTheme.background,
            backgroundSize: 'cover'
          }} />
        )}
        <motion.div
          key={countdown}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 1.5, opacity: 0 }}
          className="relative z-10"
        >
          <div 
            className="font-display text-[200px] font-bold"
            style={{ 
              color: currentTheme.hitZone,
              textShadow: `0 0 50px ${currentTheme.hitZone}`
            }}
          >
            {countdown}
          </div>
        </motion.div>
      </div>
    )
  }

  // Repetition warning
  if (isRepetitionRequired) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50 bg-red-900/90">
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="text-center"
        >
          <div className="text-8xl mb-4">🌟</div>
          <h2 className="font-display text-4xl text-white mb-2">¡Vamos a repetir!</h2>
          <p className="text-white/70 mb-6">Has fallado {maxFails} veces, pero puedes hacerlo</p>
          <button
            onClick={() => {
              resetFails()
              useMicPracticeStore.getState().startGame()
            }}
            className="px-12 py-4 text-xl font-bold rounded-xl"
            style={{ backgroundColor: currentTheme.hitZone, color: '#000' }}
          >
            ¡INTENTAR DE NUEVO! 🚀
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <canvas ref={canvasRef} className="game-canvas" />

      {/* HUD - Score and Combo */}
      <div className="absolute top-4 left-0 right-0 flex justify-between px-8 pointer-events-none">
        <div 
          className="font-display text-4xl"
          style={{ color: currentTheme.noteColors[0] }}
        >
          {score.toLocaleString()}
        </div>
        <div className="flex gap-8">
          <div className="text-center">
            <div className="text-2xl font-display text-green-400">
              {combo}x
            </div>
            <div className="text-xs text-white/50">Combo</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-display text-blue-400">
              {maxStreak}
            </div>
            <div className="text-xs text-white/50">Racha</div>
          </div>
        </div>
      </div>

      {/* Instrument and helper */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-4">
        <span 
          className="text-sm px-3 py-1 rounded-full"
          style={{ 
            backgroundColor: instrumentConfig?.color + '30',
            color: instrumentConfig?.color 
          }}
        >
          🎻 {instrumentConfig?.name}
        </span>
        <span className="text-2xl animate-bounce">
          {HELPER_CHARACTERS[helperCharacter].emoji}
        </span>
      </div>

      {/* Encouragement message */}
      <AnimatePresence>
        {showEncouragement && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.8 }}
            className="absolute top-1/3 left-1/2 -translate-x-1/2 text-center"
          >
            <div 
              className="text-3xl font-bold px-8 py-4 rounded-2xl"
              style={{ 
                backgroundColor: currentTheme.hitZone + '30',
                color: currentTheme.hitZone
              }}
            >
              {showEncouragement}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mic status */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 text-white/60">
        {isListening ? (
          <>
            <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm">Micrófono activo - ¡Toca tu instrumento! 🎵</span>
          </>
        ) : (
          <span className="text-sm">Iniciando...</span>
        )}
      </div>

      {/* Exit hint */}
      <button
        onClick={endGame}
        className="absolute top-4 right-4 text-white/30 hover:text-white text-sm"
      >
        ESC para salir
      </button>
    </div>
  )
}