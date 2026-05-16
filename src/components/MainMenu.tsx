'use client'

import { motion } from 'framer-motion'
import { useGameStore } from '@/hooks/useGameStore'
import { useMicPracticeStore } from '@/hooks/useMicPracticeStore'
import { ALL_INSTRUMENTS } from '@/lib/instrument-keys'

interface MainMenuProps {
  onShowAdmin: () => void
  onOpenConverter?: () => void
  onStartGame?: () => void
}

export default function MainMenu({ onShowAdmin, onOpenConverter, onStartGame }: MainMenuProps) {
  const { setScreen, selectInstrument, selectedInstrument } = useGameStore()

  const stringInstruments = Object.entries(ALL_INSTRUMENTS).filter(([_, v]) => v.type === 'strings')
  const windInstruments = Object.entries(ALL_INSTRUMENTS).filter(([_, v]) => v.type === 'winds')
  const percussionInstruments = Object.entries(ALL_INSTRUMENTS).filter(([_, v]) => v.type === 'percussion')
  const keyboardInstruments = Object.entries(ALL_INSTRUMENTS).filter(([_, v]) => v.type === 'keyboard')

  function handleStart() {
    if (selectedInstrument) {
      setScreen('songs')
      if (onStartGame) onStartGame()
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-cute-gradient relative overflow-hidden p-4 pt-20">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-pink-200/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-200/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center mb-8"
      >
        <h1 className="font-display text-5xl md:text-7xl font-bold text-rainbow mb-2 animate-bounce-fun">
          🎵 ORCHESTRA HERO 🎵
        </h1>
        <p className="text-slate-600 text-xl font-medium">
          ¡Aprende música tocando tu instrumento!
        </p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mb-6"
      >
        <div className="text-center bg-white/80 border-2 border-pink-200/50 rounded-3xl px-8 py-6 backdrop-blur-sm shadow-lg">
          <p className="text-3xl mb-3">👋 ¡Hola, amigo! ¿Listo para tocar?</p>
          <p className="text-slate-500 text-lg">
            Elige tu instrumento favorito y toca las notas cuando lleguen a la línea 🎯
          </p>
          <div className="flex justify-center gap-2 mt-4">
            <span className="text-4xl animate-bounce-fun">🎸</span>
            <span className="text-4xl animate-bounce-fun" style={{ animationDelay: '0.3s' }}>🎺</span>
            <span className="text-4xl animate-bounce-fun" style={{ animationDelay: '0.6s' }}>🎹</span>
          </div>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mb-8 w-full max-w-4xl"
      >
        <p className="text-slate-400 text-sm mb-4 text-center">¿Qué instrumento tocas?</p>
        
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-slate-400 text-xs mb-2">🎻 CUERDAS</p>
            <div className="flex flex-wrap justify-center gap-2">
              {stringInstruments.map(([key, inst]) => (
                <motion.button
                  key={key}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => selectInstrument(key)}
                  className={`px-4 py-2 rounded-full text-sm transition-all ${
                    selectedInstrument === key 
                      ? 'text-white shadow-lg' 
                      : 'text-slate-600 bg-white border-2 border-slate-200 hover:border-pink-300 hover:bg-pink-50'
                  }`}
                  style={{ 
                    backgroundColor: selectedInstrument === key ? inst.color : undefined,
                    border: selectedInstrument === key ? 'none' : undefined
                  }}
                >
                  {inst.name}
                </motion.button>
              ))}
            </div>
          </div>

          <div className="text-center">
            <p className="text-slate-400 text-xs mb-2">🎺 VIENTOS</p>
            <div className="flex flex-wrap justify-center gap-2">
              {windInstruments.map(([key, inst]) => (
                <motion.button
                  key={key}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => selectInstrument(key)}
                  className={`px-4 py-2 rounded-full text-sm transition-all ${
                    selectedInstrument === key 
                      ? 'text-white shadow-lg' 
                      : 'text-slate-600 bg-white border-2 border-slate-200 hover:border-pink-300 hover:bg-pink-50'
                  }`}
                  style={{ 
                    backgroundColor: selectedInstrument === key ? inst.color : undefined,
                    border: selectedInstrument === key ? 'none' : undefined
                  }}
                >
                  {inst.name}
                </motion.button>
              ))}
            </div>
          </div>

          <div className="text-center">
            <div className="flex justify-center gap-8">
              <div>
                <p className="text-slate-400 text-xs mb-2">🥁 PERCUSIÓN</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {percussionInstruments.map(([key, inst]) => (
                    <motion.button
                      key={key}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => selectInstrument(key)}
                      className={`px-4 py-2 rounded-full text-sm transition-all ${
                        selectedInstrument === key 
                          ? 'text-white shadow-lg' 
                          : 'text-slate-600 bg-white border-2 border-slate-200 hover:border-pink-300 hover:bg-pink-50'
                      }`}
                      style={{ 
                        backgroundColor: selectedInstrument === key ? inst.color : undefined,
                        border: selectedInstrument === key ? 'none' : undefined
                      }}
                    >
                      {inst.name}
                    </motion.button>
                  ))}
                </div>
              </div>
              
              <div>
                <p className="text-slate-400 text-xs mb-2">🎹 TECLADO</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {keyboardInstruments.map(([key, inst]) => (
                    <motion.button
                      key={key}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => selectInstrument(key)}
                      className={`px-4 py-2 rounded-full text-sm transition-all ${
                        selectedInstrument === key 
                          ? 'text-white shadow-lg' 
                          : 'text-slate-600 bg-white border-2 border-slate-200 hover:border-pink-300 hover:bg-pink-50'
                      }`}
                      style={{ 
                        backgroundColor: selectedInstrument === key ? inst.color : undefined,
                        border: selectedInstrument === key ? 'none' : undefined
                      }}
                    >
                      {inst.name}
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex flex-wrap justify-center gap-4 mb-6"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setScreen('achievements')}
          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-bold shadow-lg hover:shadow-purple-400/40 flex items-center gap-2"
        >
          🏆 Logros
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setScreen('listenRepeat')}
          disabled={!selectedInstrument}
          className={`px-6 py-3 rounded-2xl font-bold shadow-lg flex items-center gap-2 ${
            selectedInstrument 
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-green-400/40'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          🎧 Escuchar y Repetir
        </motion.button>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <motion.button
          onClick={handleStart}
          disabled={!selectedInstrument}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          className={`px-16 py-6 text-2xl font-bold rounded-3xl transition-all shadow-2xl ${
            selectedInstrument 
              ? 'bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-500 text-white hover:shadow-orange-400/50' 
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          🎮 ¡JUGAR! 🎮
        </motion.button>
      </motion.div>

      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="absolute bottom-4 text-slate-300 text-sm"
      >
        <button onClick={onShowAdmin} className="hover:text-slate-500">
          ⚙️
        </button>
      </motion.p>
    </div>
  )
}