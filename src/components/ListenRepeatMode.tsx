'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { ParsedNote } from '@/lib/musicxml-parser'
import { useListenRepeatStore, midiToNoteName } from '@/hooks/listenRepeatStore'
import { getAudioDetector, AudioDetector } from '@/lib/audio-detector'

interface ListenRepeatModeProps {
  notes: ParsedNote[]
  onComplete?: (correct: number, total: number) => void
  onBack?: () => void
}

export default function ListenRepeatMode({ notes, onComplete, onBack }: ListenRepeatModeProps) {
  const [sessionCorrect, setSessionCorrect] = useState(0)
  const [sessionTotal, setSessionTotal] = useState(0)
  const [detectedNote, setDetectedNote] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<'waiting' | 'listening' | 'correct' | 'incorrect'>('waiting')
  const [micActive, setMicActive] = useState(false)
  const audioDetectorRef = useRef<AudioDetector | null>(null)
  const animationRef = useRef<number | null>(null)

  const {
    listenEnabled,
    repeatEnabled,
    listenCount,
    autoProgress,
    isPlayingBack,
    currentNoteIndex,
    waitingForInput,
    setListenMode,
    setRepeatMode,
    setListenCount,
    initAudio,
    playMelody,
    reset
  } = useListenRepeatStore()

  // Initialize audio and detector
  useEffect(() => {
    initAudio()
    audioDetectorRef.current = getAudioDetector()
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      reset()
    }
  }, [])

  // Start microphone detection when waiting for input
  useEffect(() => {
    if (waitingForInput && !micActive) {
      startMicDetection()
    } else if (!waitingForInput && micActive) {
      stopMicDetection()
    }
  }, [waitingForInput])

  const startMicDetection = async () => {
    if (!audioDetectorRef.current) return
    
    const success = await audioDetectorRef.current.init()
    if (success) {
      setMicActive(true)
      detectLoop()
    }
  }

  const stopMicDetection = () => {
    if (audioDetectorRef.current) {
      audioDetectorRef.current.stopListening()
    }
    setMicActive(false)
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
  }

  const detectLoop = () => {
    if (!audioDetectorRef.current || !waitingForInput) return
    
    const detected = audioDetectorRef.current.detectNote()
    if (detected) {
      handleMicInput(detected.midi)
    }
    
    animationRef.current = requestAnimationFrame(detectLoop)
  }

  const handleStart = useCallback(async () => {
    await initAudio()
    await playMelody(notes)
  }, [notes])

  const handlePlayAgain = useCallback(async () => {
    setFeedback('waiting')
    await playMelody(notes)
  }, [notes])

  const handleMicInput = useCallback((detectedMidi: number) => {
    if (!waitingForInput || isPlayingBack) return

    setDetectedNote(midiToNoteName(detectedMidi))
    const targetNote = notes[currentNoteIndex]
    if (!targetNote) return

    const diff = Math.abs(detectedMidi - targetNote.midi)
    
    if (diff === 0) {
      setFeedback('correct')
      setSessionCorrect(prev => prev + 1)
      setSessionTotal(prev => prev + 1)
      
      if (autoProgress && currentNoteIndex < notes.length - 1) {
        setTimeout(() => {
          setFeedback('waiting')
        }, 500)
      }
    } else if (diff <= 1) {
      setFeedback('correct')
      setSessionCorrect(prev => prev + 1)
      setSessionTotal(prev => prev + 1)
    } else {
      setFeedback('incorrect')
      setSessionTotal(prev => prev + 1)
    }
  }, [waitingForInput, isPlayingBack, currentNoteIndex, notes, autoProgress])

  useEffect(() => {
    if (onComplete && sessionTotal > 0 && !waitingForInput && currentNoteIndex >= notes.length - 1) {
      onComplete(sessionCorrect, sessionTotal)
    }
  }, [sessionCorrect, sessionTotal, waitingForInput, currentNoteIndex, notes.length])

  const targetNote = notes[currentNoteIndex]
  const progress = ((currentNoteIndex + 1) / notes.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => {
              stopMicDetection()
              onBack?.()
            }}
            className="text-slate-400 hover:text-white text-lg"
          >
            ← Volver
          </button>
          <h1 className="text-3xl font-bold text-white">Escucha y Repite</h1>
          <div className="w-20" />
        </div>

        <div className="bg-slate-800/50 rounded-2xl p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-slate-400">Progreso</span>
            <span className="text-white font-bold">{currentNoteIndex + 1} / {notes.length}</span>
          </div>
          <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-800/50 rounded-xl p-4">
            <div className="text-slate-400 text-sm mb-1">Aciertos</div>
            <div className="text-3xl font-bold text-green-400">
              {sessionCorrect} <span className="text-slate-500 text-lg">/ {sessionTotal}</span>
            </div>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4">
            <div className="text-slate-400 text-sm mb-1">Nota Objetivo</div>
            <div className="text-3xl font-bold text-purple-400">
              {targetNote ? midiToNoteName(targetNote.midi) : '--'}
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-2xl p-12 text-center mb-6">
          <div className="text-8xl mb-4">
            {isPlayingBack ? '🔊' : waitingForInput ? (micActive ? '🎤' : '🎤⏳') : '▶️'}
          </div>
          
          <div className={`text-4xl font-bold mb-4 ${
            feedback === 'correct' ? 'text-green-400' :
            feedback === 'incorrect' ? 'text-red-400' :
            'text-white'
          }`}>
            {isPlayingBack 
              ? 'Escucha...' 
              : waitingForInput 
                ? feedback === 'correct' 
                  ? '¡Correcto!' 
                  : feedback === 'incorrect'
                    ? 'Intenta de nuevo'
                    : 'Toca la nota'
                : 'Presiona Iniciar'}
          </div>

          {detectedNote && (
            <div className="text-slate-400 text-lg">
              Nota detectada: <span className="text-white font-bold">{detectedNote}</span>
            </div>
          )}

          {!isPlayingBack && !waitingForInput && (
            <button
              onClick={handleStart}
              className="mt-6 px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white text-xl font-bold rounded-xl transition-colors"
            >
              🎵 Escuchar Melodía
            </button>
          )}

          {waitingForInput && (
            <button
              onClick={handlePlayAgain}
              className="mt-6 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white text-lg font-bold rounded-xl transition-colors"
            >
              🔄 Repitir
            </button>
          )}
        </div>

        <div className="bg-slate-800/50 rounded-xl p-4">
          <h3 className="text-white font-semibold mb-3">Configuración</h3>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={listenEnabled}
                onChange={(e) => setListenMode(e.target.checked)}
                className="w-5 h-5 rounded"
              />
              <span className="text-slate-300">Reproducir notas</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={repeatEnabled}
                onChange={(e) => setRepeatMode(e.target.checked)}
                className="w-5 h-5 rounded"
              />
              <span className="text-slate-300">Permitir repetición</span>
            </label>
          </div>
          <div className="mt-4">
            <label className="text-slate-400 text-sm">Veces a reproducir:</label>
            <div className="flex gap-2 mt-2">
              {[1, 2, 3, 4].map(num => (
                <button
                  key={num}
                  onClick={() => setListenCount(num)}
                  className={`px-4 py-2 rounded-lg font-bold ${
                    listenCount === num
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  {num}x
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-900/30 border border-blue-700 rounded-xl">
          <h4 className="text-blue-400 font-bold mb-2">💡 Cómo funciona</h4>
          <ul className="text-slate-300 text-sm space-y-1">
            <li>• Primero escucharás la melodía {listenCount} vez{listenCount > 1 ? 'es' : ''}</li>
            <li>• Luego toca las notas con tu instrumento</li>
            <li>• El micrófono detectará tu playing en tiempo real</li>
            <li>• ¡Practica hasta dominar la melodía!</li>
          </ul>
        </div>
      </div>
    </div>
  )
}