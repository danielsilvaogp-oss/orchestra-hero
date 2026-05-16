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

  // Group instruments by type
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-cute-gradient relative overflow-hidden p-4">
      {/* Animated cute background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/4 right-1/3 w-48 h-48 bg-yellow-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>

      {/* Title with rainbow effect */}
      <motion.div 
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center mb-8"
      >
        <h1 className="font-display text-5xl md:text-7xl font-bold text-rainbow mb-2 animate-bounce-fun">
          🎵 ORCHESTRA HERO 🎵
        </h1>
        <p className="text-white/70 text-xl font-medium">
          ¡Aprende música tocando tu instrumento!
        </p>
      </motion.div>

      {/* Welcome message for kids - Cute bubble */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mb-6"
      >
        <div className="text-center bg-gradient-to-r from-pink-500/20 to-purple-500/20 border-2 border-pink-400/30 rounded-3xl px-8 py-6 backdrop-blur-sm">
          <p className="text-3xl mb-3">👋 ¡Hola, amigo! ¿Listo para tocar?</p>
          <p className="text-white/60 text-lg">
            Elige tu instrumento favorito y toca las notas cuando lleguen a la línea 🎯
          </p>
          <div className="flex justify-center gap-2 mt-4">
            <span className="text-4xl animate-bounce-fun">🎸</span>
            <span className="text-4xl animate-bounce-fun" style={{ animationDelay: '0.3s' }}>🎺</span>
            <span className="text-4xl animate-bounce-fun" style={{ animationDelay: '0.6s' }}>🎹</span>
          </div>
        </div>
      </motion.div>

      {/* Instrument Selection */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mb-8 w-full max-w-4xl"
      >
        <p className="text-white/40 text-sm mb-4 text-center">¿Qué instrumento tocas?</p>
        
        <div className="space-y-4">
          {/* Strings */}
          <div className="text-center">
            <p className="text-white/30 text-xs mb-2">🎻 CUERDAS</p>
            <div className="flex flex-wrap justify-center gap-2">
              {stringInstruments.map(([key, inst]) => (
                <motion.button
                  key={key}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => selectInstrument(key)}
                  className={`px-4 py-2 rounded-full text-sm transition-all ${
                    selectedInstrument === key 
                      ? 'text-white' 
                      : 'text-white/60 hover:text-white bg-white/10 hover:bg-white/20'
                  }`}
                  style={{ 
                    backgroundColor: selectedInstrument === key ? inst.color + '40' : undefined,
                    border: selectedInstrument === key ? `2px solid ${inst.color}` : '2px solid transparent'
                  }}
                >
                  {inst.name}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Winds */}
          <div className="text-center">
            <p className="text-white/30 text-xs mb-2">🎺 VIENTOS</p>
            <div className="flex flex-wrap justify-center gap-2">
              {windInstruments.map(([key, inst]) => (
                <motion.button
                  key={key}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => selectInstrument(key)}
                  className={`px-4 py-2 rounded-full text-sm transition-all ${
                    selectedInstrument === key 
                      ? 'text-white' 
                      : 'text-white/60 hover:text-white bg-white/10 hover:bg-white/20'
                  }`}
                  style={{ 
                    backgroundColor: selectedInstrument === key ? inst.color + '40' : undefined,
                    border: selectedInstrument === key ? `2px solid ${inst.color}` : '2px solid transparent'
                  }}
                >
                  {inst.name}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Percussion & Keyboard */}
          <div className="text-center">
            <div className="flex justify-center gap-8">
              <div>
                <p className="text-white/30 text-xs mb-2">🥁 PERCUSIÓN</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {percussionInstruments.map(([key, inst]) => (
                    <motion.button
                      key={key}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => selectInstrument(key)}
                      className={`px-4 py-2 rounded-full text-sm transition-all ${
                        selectedInstrument === key 
                          ? 'text-white' 
                          : 'text-white/60 hover:text-white bg-white/10 hover:bg-white/20'
                      }`}
                      style={{ 
                        backgroundColor: selectedInstrument === key ? inst.color + '40' : undefined,
                        border: selectedInstrument === key ? `2px solid ${inst.color}` : '2px solid transparent'
                      }}
                    >
                      {inst.name}
                    </motion.button>
                  ))}
                </div>
              </div>
              
              <div>
                <p className="text-white/30 text-xs mb-2">🎹 TECLADO</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {keyboardInstruments.map(([key, inst]) => (
                    <motion.button
                      key={key}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => selectInstrument(key)}
                      className={`px-4 py-2 rounded-full text-sm transition-all ${
                        selectedInstrument === key 
                          ? 'text-white' 
                          : 'text-white/60 hover:text-white bg-white/10 hover:bg-white/20'
                      }`}
                      style={{ 
                        backgroundColor: selectedInstrument === key ? inst.color + '40' : undefined,
                        border: selectedInstrument === key ? `2px solid ${inst.color}` : '2px solid transparent'
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

      {/* Additional Modes */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex gap-4 mb-6"
      >
        <button
          onClick={() => useGameStore.getState().setScreen('achievements')}
          className="px-6 py-3 bg-purple-600/30 border border-purple-500 hover:bg-purple-600/50 text-white rounded-xl font-semibold transition-colors"
        >
          🏆 Logros
        </button>
        <button
          onClick={() => useGameStore.getState().setScreen('listenRepeat')}
          disabled={!selectedInstrument}
          className={`px-6 py-3 rounded-xl font-semibold transition-colors ${
            selectedInstrument 
              ? 'bg-green-600/30 border border-green-500 hover:bg-green-600/50 text-white'
              : 'bg-white/10 border border-white/10 text-white/30 cursor-not-allowed'
          }`}
        >
          🎧 Escucha y Repite
        </button>
      </motion.div>

      {/* Additional Modes - Cute buttons */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex flex-wrap justify-center gap-4 mb-6"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => useGameStore.getState().setScreen('achievements')}
          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-bold shadow-lg hover:shadow-purple-500/40 flex items-center gap-2"
        >
          🏆 Logros
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => useGameStore.getState().setScreen('listenRepeat')}
          disabled={!selectedInstrument}
          className={`px-6 py-3 rounded-2xl font-bold shadow-lg flex items-center gap-2 ${
            selectedInstrument 
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-green-500/40'
              : 'bg-white/10 text-white/30 cursor-not-allowed'
          }`}
        >
          🎧 Escuchar y Repetir
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onShowAdmin?.()}
          className="px-6 py-3 bg-white/10 text-white/60 rounded-2xl font-bold border-2 border-white/20 hover:border-white/40"
        >
          ⚙️ Ajustes
        </motion.button>
      </motion.div>

      {/* Play Button - Cute and big */}
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
              ? 'bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-500 text-white hover:shadow-orange-500/50' 
              : 'bg-white/10 text-white/30 cursor-not-allowed'
          }`}
        >
          🎮 ¡JUGAR! 🎮
        </motion.button>
      </motion.div>

      {/* Admin button */}
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="absolute bottom-4 text-white/20 text-sm"
      >
        <button onClick={onShowAdmin} className="hover:text-white/40">
          ⚙️
        </button>
      </motion.p>
    </div>
  )
}