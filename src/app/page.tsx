'use client'

import { useState } from 'react'
import { useGameStore } from '@/hooks/useGameStore'
import MainMenu from '@/components/MainMenu'
import SongSelection from '@/components/SongSelection'
import InstrumentSelector from '@/components/InstrumentSelector'
import GameSetup from '@/components/GameSetup'
import OrchestraHeroGame from '@/components/OrchestraHeroGame'
import ResultsScreen from '@/components/ResultsScreen'
import AdminPanel from '@/components/AdminPanel'
import PDFConverter from '@/components/PDFConverter'
import AchievementDisplay from '@/components/AchievementDisplay'
import ListenRepeatMode from '@/components/ListenRepeatMode'
import { useMicPracticeStore } from '@/hooks/useMicPracticeStore'
import { useListenRepeatStore } from '@/hooks/listenRepeatStore'

export default function Home() {
  const screen = useGameStore(state => state.screen)
  const [showAdmin, setShowAdmin] = useState(false)
  const [showConverter, setShowConverter] = useState(false)
  const [customMusicXML, setCustomMusicXML] = useState<string | null>(null)
  const [customMetadata, setCustomMetadata] = useState<any>(null)

  // Player stats for achievements (mock for now)
  const [playerStats] = useState({
    totalPlays: 15,
    totalScore: 25000,
    totalNotesHit: 450,
    perfectCount: 120,
    maxCombo: 35,
    maxStreak: 35,
    instrumentsPlayed: ['violin', 'flute'],
    songsCompleted: ['ode_to_joy', 'c_major_scale'],
    practiceTime: 3600,
    currentLevel: 3
  })

  // Notes for listen repeat mode
  const listenRepeatNotes = useMicPracticeStore(state => state.notes)

  function handleImportFromConverter(musicxml: string, metadata: any) {
    setCustomMusicXML(musicxml)
    setCustomMetadata(metadata)
    setShowConverter(false)
    useGameStore.getState().setScreen('playing')
    useMicPracticeStore.getState().startGame()
  }

  function handleListenRepeatComplete(correct: number, total: number) {
    console.log(`Listen & Repeat complete: ${correct}/${total}`)
    useGameStore.getState().setScreen('menu')
  }

  return (
    <main>
      {screen === 'menu' && !showConverter && (
        <MainMenu 
          onShowAdmin={() => setShowAdmin(true)}
          onOpenConverter={() => setShowConverter(true)}
        />
      )}
      
      {showConverter && (
        <PDFConverter 
          onImportToGame={handleImportFromConverter}
          onClose={() => setShowConverter(false)}
        />
      )}
      
      {screen === 'songs' && !showConverter && (
        <SongSelection 
          onTrackSelect={() => {}}
        />
      )}
      
      {screen === 'playing' && (
        <OrchestraHeroGame 
          onClose={() => {
            useGameStore.getState().setScreen('menu')
            setCustomMusicXML(null)
          }}
        />
      )}
      
      {screen === 'results' && <ResultsScreen />}
      
      {screen === 'achievements' && (
        <AchievementDisplay 
          stats={playerStats}
          onClose={() => useGameStore.getState().setScreen('menu')}
        />
      )}
      
      {screen === 'listenRepeat' && listenRepeatNotes && listenRepeatNotes.length > 0 && (
        <ListenRepeatMode 
          notes={listenRepeatNotes}
          onComplete={handleListenRepeatComplete}
          onBack={() => useGameStore.getState().setScreen('menu')}
        />
      )}
      
      {showAdmin && !showConverter && <AdminPanel onClose={() => setShowAdmin(false)} />}
    </main>
  )
}