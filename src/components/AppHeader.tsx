'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '@/hooks/useGameStore'

interface AppHeaderProps {
  onOpenConverter: () => void
  onShowAdmin?: () => void
}

export default function AppHeader({ onOpenConverter, onShowAdmin }: AppHeaderProps) {
  const [activeTab, setActiveTab] = useState<'game' | 'pdf'>('game')
  const screen = useGameStore(state => state.screen)
  const isPlaying = screen === 'playing' || screen === 'songs' || screen === 'results'

  if (isPlaying) {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md shadow-lg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎵</span>
            <span className="font-bold text-xl text-purple-600">Music Trainer</span>
          </div>
          <button
            onClick={() => useGameStore.getState().setScreen('menu')}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors"
          >
            ← Volver
          </button>
        </div>
      </header>
    )
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md shadow-lg border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎵</span>
            <span className="font-bold text-xl text-purple-600">Music Trainer</span>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 rounded-2xl p-1">
            <motion.button
              onClick={() => setActiveTab('game')}
              animate={{ scale: activeTab === 'game' ? 1.05 : 1 }}
              className={`px-5 py-2 rounded-xl font-semibold transition-all ${
                activeTab === 'game'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              🎮 Juego
            </motion.button>
            <motion.button
              onClick={() => {
                setActiveTab('pdf')
                onOpenConverter()
              }}
              animate={{ scale: activeTab === 'pdf' ? 1.05 : 1 }}
              className={`px-5 py-2 rounded-xl font-semibold transition-all ${
                activeTab === 'pdf'
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              📄 PDF
            </motion.button>
          </div>

          {onShowAdmin && (
            <button
              onClick={onShowAdmin}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
            >
              ⚙️
            </button>
          )}
        </div>
      </div>
    </header>
  )
}