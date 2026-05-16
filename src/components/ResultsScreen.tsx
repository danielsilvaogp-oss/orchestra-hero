'use client'

import { motion } from 'framer-motion'
import { useGameStore } from '@/hooks/useGameStore'

export default function ResultsScreen() {
  const { 
    setScreen, 
    getResults, 
    resetGame,
    selectedSong,
    selectedInstrument 
  } = useGameStore()

  const results = getResults()

  const gradeColors: Record<string, string> = {
    'S': 'text-yellow-400 drop-shadow-[0_0_20px_rgba(255,215,0,0.8)]',
    'A': 'text-green-400 drop-shadow-[0_0_20px_rgba(51,255,102,0.8)]',
    'B': 'text-blue-400 drop-shadow-[0_0_20px_rgba(51,153,255,0.8)]',
    'C': 'text-white',
    'D': 'text-orange-400',
    'F': 'text-red-400'
  }

  const timingColors: Record<string, string> = {
    perfect: 'text-yellow-400',
    great: 'text-green-400',
    good: 'text-blue-400',
    ok: 'text-gray-400',
    miss: 'text-red-400'
  }

  function handleRetry() {
    resetGame()
    setScreen('playing')
    useGameStore.getState().startGame()
  }

  function handleMenu() {
    resetGame()
    setScreen('menu')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-orchestra bg-grid p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass rounded-3xl p-8 md:p-12 max-w-2xl w-full"
      >
        {/* Grade */}
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring' }}
          className="text-center mb-8"
        >
          <div className={`font-display text-[150px] font-bold leading-none ${gradeColors[results.grade]}`}>
            {results.grade}
          </div>
          <p className="text-white/60 text-lg mt-2">
            {selectedSong?.title || 'Canción'}
          </p>
        </motion.div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-center"
          >
            <div className="font-display text-4xl text-orchestra-gold">
              {results.score.toLocaleString()}
            </div>
            <div className="text-white/40 text-sm mt-1">Puntuación</div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-center"
          >
            <div className="font-display text-4xl text-orchestra-gold">
              {results.accuracy.toFixed(1)}%
            </div>
            <div className="text-white/40 text-sm mt-1">Precisión</div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="text-center"
          >
            <div className="font-display text-4xl text-orchestra-gold">
              {results.maxCombo}x
            </div>
            <div className="text-white/40 text-sm mt-1">Combo máximo</div>
          </motion.div>
        </div>

        {/* Hit breakdown */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="bg-white/5 rounded-xl p-4 mb-8"
        >
          <div className="text-white/40 text-sm mb-3 text-center">Desglose de aciertos</div>
          <div className="flex justify-center gap-6">
            {(['perfect', 'great', 'good', 'ok', 'miss'] as const).map((timing) => (
              <div key={timing} className="text-center">
                <div className={`font-display text-2xl ${timingColors[timing]}`}>
                  {results.hits[timing]}
                </div>
                <div className="text-white/30 text-xs capitalize">{timing}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <button 
            onClick={handleRetry}
            className="flex-1 btn-gold text-lg"
          >
            REPETIR
          </button>
          
          <button 
            onClick={handleMenu}
            className="flex-1 btn-outline text-lg"
          >
            MENÚ PRINCIPAL
          </button>
        </motion.div>

        {/* Total notes */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center text-white/30 text-sm mt-6"
        >
          {results.totalNotes} notas procesadas
        </motion.p>
      </motion.div>
    </div>
  )
}