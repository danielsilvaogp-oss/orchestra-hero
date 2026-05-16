'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '@/hooks/useGameStore'
import { useMicPracticeStore } from '@/hooks/useMicPracticeStore'
import { ALL_INSTRUMENTS } from '@/lib/instrument-keys'
import { GAME_MODES, AGE_CONFIGS, VISUAL_THEMES } from '@/lib/pedagogical-config'
import OrchestraHeroGame from './OrchestraHeroGame'

interface GameSetupProps {
  onBack: () => void
}

export default function GameSetup({ onBack }: GameSetupProps) {
  const { selectedInstrument, selectInstrument } = useGameStore()
  const { setNotes } = useMicPracticeStore()
  
  const [step, setStep] = useState<'instrument' | 'settings' | 'game'>('instrument')
  const [gameMode, setGameMode] = useState('learn')
  const [ageGroup, setAgeGroup] = useState('6-8')
  
  // Group instruments
  const stringInstruments = Object.entries(ALL_INSTRUMENTS).filter(([_, v]) => v.type === 'strings')
  const windInstruments = Object.entries(ALL_INSTRUMENTS).filter(([_, v]) => v.type === 'winds')
  const percInstruments = Object.entries(ALL_INSTRUMENTS).filter(([_, v]) => v.type === 'percussion')
  const keyInstruments = Object.entries(ALL_INSTRUMENTS).filter(([_, v]) => v.type === 'keyboard')

  function handleStartGame() {
    if (!selectedInstrument) return
    setStep('game')
  }

  if (step === 'game') {
    return <OrchestraHeroGame onClose={onBack} />
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-orchestra bg-grid p-6">
      {/* Progress indicator */}
      <div className="flex items-center gap-4 mb-8">
        <div className={`w-3 h-3 rounded-full ${step === 'instrument' ? 'bg-orchestra-gold' : 'bg-green-400'}`} />
        <div className="w-16 h-0.5 bg-white/20" />
        <div className={`w-3 h-3 rounded-full ${step === 'settings' ? 'bg-orchestra-gold' : (step === 'game' || step === 'instrument') ? 'bg-green-400' : 'bg-white/20'}`} />
        <div className="w-16 h-0.5 bg-white/20" />
        <div className={`w-3 h-3 rounded-full ${step === 'game' ? 'bg-green-400' : 'bg-white/20'}`} />
      </div>

      {step === 'instrument' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl w-full"
        >
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="font-display text-4xl text-orchestra-gold mb-2">
              🎵 Elige tu Instrumento
            </h1>
            <p className="text-white/50">
              ¿Qué instrumento tocas?
            </p>
          </div>

          {/* Instrument Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {/* Strings */}
            {stringInstruments.map(([key, inst]) => (
              <InstrumentCard
                key={key}
                name={inst.name}
                color={inst.color}
                selected={selectedInstrument === key}
                onClick={() => selectInstrument(key)}
                icon="🎻"
              />
            ))}
            
            {/* Winds */}
            {windInstruments.map(([key, inst]) => (
              <InstrumentCard
                key={key}
                name={inst.name}
                color={inst.color}
                selected={selectedInstrument === key}
                onClick={() => selectInstrument(key)}
                icon="🎺"
              />
            ))}
            
            {/* Percussion */}
            {percInstruments.map(([key, inst]) => (
              <InstrumentCard
                key={key}
                name={inst.name}
                color={inst.color}
                selected={selectedInstrument === key}
                onClick={() => selectInstrument(key)}
                icon="🥁"
              />
            ))}
            
            {/* Keyboard */}
            {keyInstruments.map(([key, inst]) => (
              <InstrumentCard
                key={key}
                name={inst.name}
                color={inst.color}
                selected={selectedInstrument === key}
                onClick={() => selectInstrument(key)}
                icon="🎹"
              />
            ))}
          </div>

          {/* Continue button */}
          <div className="text-center">
            <button
              onClick={() => selectedInstrument && setStep('settings')}
              disabled={!selectedInstrument}
              className={`px-12 py-4 text-xl font-bold rounded-xl transition-all ${
                selectedInstrument 
                  ? 'bg-orchestra-gold text-orchestra-dark hover:scale-105' 
                  : 'bg-white/10 text-white/30 cursor-not-allowed'
              }`}
            >
              Continuar ➡️
            </button>
          </div>
        </motion.div>
      )}

      {step === 'settings' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl w-full"
        >
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="font-display text-4xl text-orchestra-gold mb-2">
              ⚙️ Configura tu Juego
            </h1>
            <p className="text-white/50">
              Elige cómo quieres jugar
            </p>
          </div>

          {/* Age Selection */}
          <div className="mb-8">
            <h2 className="text-white/60 text-sm mb-4 text-center">🎂 Tu edad</h2>
            <div className="flex justify-center gap-4">
              {Object.entries(AGE_CONFIGS).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => setAgeGroup(key)}
                  className={`px-6 py-3 rounded-xl text-lg font-medium transition-all ${
                    ageGroup === key
                      ? 'bg-orchestra-gold text-orchestra-dark'
                      : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}
                >
                  {key} años
                </button>
              ))}
            </div>
          </div>

          {/* Game Mode Selection */}
          <div className="mb-8">
            <h2 className="text-white/60 text-sm mb-4 text-center">🎮 Modo de juego</h2>
            <div className="grid grid-cols-2 gap-4">
              {Object.values(GAME_MODES).map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setGameMode(mode.id)}
                  className={`p-4 rounded-xl text-left transition-all ${
                    gameMode === mode.id
                      ? 'bg-orchestra-gold/20 border-2 border-orchestra-gold'
                      : 'bg-white/10 border-2 border-transparent hover:border-white/30'
                  }`}
                >
                  <div className="text-3xl mb-2">{mode.icon}</div>
                  <div className="text-white font-medium">{mode.name}</div>
                  <div className="text-white/50 text-sm">{mode.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Age-specific info */}
          <div className="bg-white/5 rounded-xl p-4 mb-8 text-center">
            <p className="text-white/60 text-sm">
              {ageGroup === '6-8' && '🎈 Modo para niños pequeños - Notas grandes, más ayuda visual, velocidad reducida'}
              {ageGroup === '9-11' && '⭐ Modo intermedio - Buenos desafíos sin demasiadas ayudas'}
              {ageGroup === '12+' && '🔥 Modo para mayores - Juego completo como un profesional'}
            </p>
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-between">
            <button
              onClick={() => setStep('instrument')}
              className="px-6 py-3 text-white/40 hover:text-white"
            >
              ← Atrás
            </button>
            <button
              onClick={handleStartGame}
              className="px-12 py-4 text-xl font-bold rounded-xl bg-orchestra-gold text-orchestra-dark hover:scale-105 transition-all"
            >
              🎵 ¡COMENZAR! 🚀
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}

// Instrument card component
function InstrumentCard({ 
  name, 
  color, 
  selected, 
  onClick,
  icon 
}: { 
  name: string
  color: string
  selected: boolean
  onClick: () => void
  icon: string
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`p-4 rounded-xl transition-all ${
        selected 
          ? 'border-2' 
          : 'bg-white/5 border-2 border-transparent hover:border-white/20'
      }`}
      style={{ 
        borderColor: selected ? color : undefined,
        backgroundColor: selected ? color + '20' : undefined
      }}
    >
      <div className="text-4xl mb-2">{icon}</div>
      <div 
        className="font-medium"
        style={{ color: selected ? color : 'white' }}
      >
        {name}
      </div>
      <div 
        className="w-4 h-1 rounded-full mt-2"
        style={{ backgroundColor: color }}
      />
    </motion.button>
  )
}