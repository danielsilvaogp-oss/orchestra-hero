'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore, HitTiming } from '@/hooks/useGameStore'
import { getInstrumentLanes, ALL_INSTRUMENTS, getInstrumentDisplayInfo } from '@/lib/instrument-keys'

const LANES = 4
const NOTE_TRAVEL_TIME = 2500

export default function GameScreen() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const [countdown, setCountdown] = useState(3)
  const [feedback, setFeedback] = useState<{ timing: HitTiming; visible: boolean }>({ timing: 'miss', visible: false })
  
  const {
    notes,
    processedNotes,
    gameStartTime,
    isPlaying,
    score,
    combo,
    maxStreak,
    selectedInstrument,
    playAudio,
    processHit,
    processMiss,
    endGame
  } = useGameStore()

  // Get instrument-specific key configuration
  const instrumentLanes = selectedInstrument ? getInstrumentLanes(selectedInstrument) : null
  const instrumentConfig = selectedInstrument ? ALL_INSTRUMENTS[selectedInstrument] : null
  const instrumentDisplay = selectedInstrument ? getInstrumentDisplayInfo(selectedInstrument) : null
  const instrumentColor = instrumentConfig?.color || '#d4af37'

  // Map actual keys to lanes based on instrument
  const keyToLaneMap: Record<string, number> = {}
  if (instrumentLanes) {
    instrumentLanes.forEach((lane, index) => {
      keyToLaneMap[lane.key.toLowerCase()] = index
    })
  }

  // Fallback keyboard keys
  const defaultKeys = ['a', 's', 'd', 'f']

  // Key handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      
      // Try instrument-specific key first, then fallback
      const laneIndex = keyToLaneMap[key] !== undefined 
        ? keyToLaneMap[key]
        : defaultKeys.indexOf(key)
      
      if (laneIndex >= 0) {
        checkHit(laneIndex)
      }
      
      if (e.key === 'Escape') {
        endGame()
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      // Could add visual feedback on key release
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [notes, processedNotes, gameStartTime])

  const checkHit = (lane: number) => {
    if (!isPlaying || gameStartTime === 0) return
    
    const currentTime = Date.now() - gameStartTime
    
    let closestNote: any = null
    let closestIndex = -1
    let closestDiff = Infinity

    notes.forEach((note, index) => {
      if (processedNotes.has(index)) return
      if (note.lane !== lane) return

      const diff = Math.abs(currentTime - note.startMs)
      if (diff < closestDiff && diff <= 200) {
        closestDiff = diff
        closestNote = note
        closestIndex = index
      }
    })

    if (closestNote && closestIndex >= 0) {
      processedNotes.add(closestIndex)

      let timing: HitTiming = 'miss'
      if (closestDiff <= 30) timing = 'perfect'
      else if (closestDiff <= 60) timing = 'great'
      else if (closestDiff <= 100) timing = 'good'
      else if (closestDiff <= 150) timing = 'ok'

      processHit(timing)
      showFeedback(timing)
    }
  }

  const showFeedback = (timing: HitTiming) => {
    setFeedback({ timing, visible: true })
    setTimeout(() => setFeedback({ timing: 'miss', visible: false }), 500)
  }

  // Canvas render loop
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
      const laneWidth = highwayWidth / LANES
      const highwayTop = canvas.height * 0.15
      const hitZoneY = canvas.height * 0.85

      // Draw highway background
      const gradient = ctx.createLinearGradient(0, highwayTop, 0, hitZoneY)
      gradient.addColorStop(0, '#0f0f1f')
      gradient.addColorStop(1, '#1a1a2f')
      ctx.fillStyle = gradient
      ctx.fillRect(highwayLeft, highwayTop, highwayWidth, hitZoneY - highwayTop)

      // Draw grid lines
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.1)'
      for (let i = 0; i < 20; i++) {
        const y = highwayTop + (i / 20) * (hitZoneY - highwayTop)
        ctx.beginPath()
        ctx.moveTo(highwayLeft, y)
        ctx.lineTo(highwayLeft + highwayWidth, y)
        ctx.stroke()
      }

      // Draw lanes
      for (let i = 0; i <= LANES; i++) {
        const x = highwayLeft + i * laneWidth
        ctx.strokeStyle = i > 0 && i < LANES ? 'rgba(212, 175, 55, 0.3)' : 'rgba(212, 175, 55, 0.5)'
        ctx.lineWidth = i > 0 && i < LANES ? 2 : 3
        ctx.beginPath()
        ctx.moveTo(x, highwayTop)
        ctx.lineTo(x, hitZoneY + 30)
        ctx.stroke()
      }

      // Draw hit zone with instrument-specific labels
      for (let i = 0; i < LANES; i++) {
        const x = highwayLeft + i * laneWidth
        
        // Hit target
        ctx.fillStyle = 'rgba(68, 68, 170, 0.5)'
        ctx.beginPath()
        ctx.roundRect(x + 5, hitZoneY - 8, laneWidth - 10, 16, 8)
        ctx.fill()
        
        // Key label - use instrument specific or fallback
        const keyLabel = instrumentLanes?.[i]?.key.toUpperCase() || defaultKeys[i].toUpperCase()
        const positionLabel = instrumentLanes?.[i]?.position.split(' ')[0] || ''
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
        ctx.font = 'bold 14px Inter'
        ctx.textAlign = 'center'
        ctx.fillText(keyLabel, x + laneWidth / 2, hitZoneY + 25)
        
        if (positionLabel) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
          ctx.font = '10px Inter'
          ctx.fillText(positionLabel, x + laneWidth / 2, hitZoneY + 38)
        }
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
        
        const lane = note.lane % LANES
        const x = highwayLeft + lane * laneWidth + laneWidth / 2
        
        const noteWidth = laneWidth - 20
        const noteHeight = 40

        // Note body
        ctx.fillStyle = instrumentColor
        ctx.beginPath()
        ctx.roundRect(x - noteWidth / 2, y, noteWidth, noteHeight, 10)
        ctx.fill()

        // Note border
        ctx.strokeStyle = 'white'
        ctx.lineWidth = 2
        ctx.stroke()

        // Note label
        ctx.fillStyle = 'white'
        ctx.font = 'bold 14px Inter'
        ctx.textAlign = 'center'
        ctx.fillText(note.pitch, x, y + noteHeight / 2 + 5)
      })

      // Check for missed notes
      if (isPlaying && gameStartTime > 0) {
        const currentTime = Date.now() - gameStartTime
        notes.forEach((note, index) => {
          if (processedNotes.has(index)) return
          if (currentTime > note.startMs + 200) {
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
  }, [notes, processedNotes, gameStartTime, isPlaying, instrumentLanes, instrumentColor, processMiss, endGame])

  // Countdown
  useEffect(() => {
    if (!isPlaying) {
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
  }, [isPlaying])

  // Countdown overlay
  if (countdown > 0) {
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

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <canvas ref={canvasRef} className="game-canvas" />

      {/* HUD */}
      <div className="absolute top-4 left-0 right-0 flex justify-between px-8 pointer-events-none">
        <div className="text-orchestra-gold font-display text-3xl">
          {score.toLocaleString()}
        </div>
        <div className="flex gap-6">
          <div className="text-green-400 font-display text-2xl">
            Combo: {combo}
          </div>
          <div className="text-orchestra-blue font-display text-2xl">
            Max: {maxStreak}
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

      {/* Key legend */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 flex gap-4 text-xs text-white/40">
        {instrumentLanes?.map((lane, i) => (
          <div key={i} className="text-center">
            <span className="block text-white/60 font-bold">{lane.key.toUpperCase()}</span>
            <span>{lane.position.split(' ')[0]}</span>
          </div>
        ))}
      </div>

      {/* Hit feedback */}
      <AnimatePresence>
        {feedback.visible && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 1.2, opacity: 0 }}
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
              font-display text-5xl font-bold
              ${feedback.timing === 'perfect' ? 'text-yellow-400' : ''}
              ${feedback.timing === 'great' ? 'text-green-400' : ''}
              ${feedback.timing === 'good' ? 'text-blue-400' : ''}
              ${feedback.timing === 'ok' ? 'text-white' : ''}
              ${feedback.timing === 'miss' ? 'text-red-400' : ''}
            `}
          >
            {feedback.timing.toUpperCase()}!
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/30 text-sm">
        Presiona ESC para salir
      </div>
    </div>
  )
}