'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '@/hooks/useGameStore'
import { useMicPracticeStore } from '@/hooks/useMicPracticeStore'
import { SongTrack, extractTracksFromMusicXML, getTrackColor } from '@/lib/instrument-selection'
import { ALL_INSTRUMENTS } from '@/lib/instrument-keys'

interface InstrumentSelectorProps {
  onClose: () => void
}

export default function InstrumentSelector({ onClose }: InstrumentSelectorProps) {
  const { selectedSong, setNotes, setScreen } = useGameStore()
  const { startGame } = useMicPracticeStore()
  
  const [tracks, setTracks] = useState<SongTrack[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTrackId, setSelectedTrackId] = useState<number | null>(null)

  useEffect(() => {
    if (selectedSong?.musicxml_url) {
      loadTracks()
    }
  }, [selectedSong])

  async function loadTracks() {
    if (!selectedSong?.musicxml_url) return
    
    setLoading(true)
    const extractedTracks = await extractTracksFromMusicXML(selectedSong.musicxml_url)
    setTracks(extractedTracks)
    setLoading(false)
  }

  async function handleSelectTrack(track: SongTrack) {
    if (!selectedSong?.musicxml_url) return
    
    setSelectedTrackId(track.id)
    
    try {
      // Fetch and parse the MusicXML
      const response = await fetch(selectedSong.musicxml_url)
      const xmlText = await response.text()
      
      const { parseMusicXML, getAllNotes } = await import('@/lib/musicxml-parser')
      const parsed = parseMusicXML(xmlText)
      
      if (parsed && parsed.parts[track.id]) {
        // Get only notes from this track
        const notes = getAllNotes(parsed, track.id)
        
        // Add track info to notes
        notes.forEach(note => {
          note.track = track.id
        })
        
        setNotes(notes)
        
        // Select the instrument for the visual config
        useGameStore.getState().selectInstrument(track.instrument)
        
        // Start the game
        setScreen('playing')
        startGame()
      }
    } catch (error) {
      console.error('Error loading track:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orchestra-dark">
        <div className="text-center">
          <div className="spinner mb-4 mx-auto" />
          <p className="text-white/60">Cargando instrumentos...</p>
        </div>
      </div>
    )
  }

  // Only one track - start directly
  if (tracks.length === 1) {
    useEffect(() => {
      handleSelectTrack(tracks[0])
    }, [])
    return null
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-orchestra bg-grid p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass rounded-2xl p-8 max-w-md w-full"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-display text-2xl text-orchestra-gold mb-2">
            {selectedSong?.title || 'Canción'}
          </h1>
          <p className="text-white/50 text-sm">
            Selecciona el instrumento que quieres practicar
          </p>
        </div>

        {/* Track/Instrument List */}
        <div className="space-y-3 mb-8">
          {tracks.map((track) => {
            const instrument = ALL_INSTRUMENTS[track.instrument]
            const color = track.color || instrument?.color || '#d4af37'
            
            return (
              <motion.button
                key={track.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelectTrack(track)}
                className="w-full p-4 rounded-xl text-left transition-all"
                style={{
                  backgroundColor: `${color}15`,
                  borderColor: `${color}40`,
                  borderWidth: '1px'
                }}
              >
                <div className="flex items-center gap-4">
                  {/* Color indicator */}
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  
                  {/* Instrument info */}
                  <div className="flex-1">
                    <div className="text-white font-medium">
                      {instrument?.name || track.instrument}
                    </div>
                    <div className="text-white/40 text-sm">
                      {track.name}
                    </div>
                  </div>
                  
                  {/* Note count */}
                  <div className="text-right">
                    <div className="text-orchestra-gold font-display text-lg">
                      {track.noteCount}
                    </div>
                    <div className="text-white/30 text-xs">notas</div>
                  </div>
                </div>
                
                {/* Type badge */}
                <div className="mt-2 flex gap-2">
                  <span 
                    className="text-xs px-2 py-0.5 rounded"
                    style={{ 
                      backgroundColor: `${color}30`, 
                      color: color 
                    }}
                  >
                    {instrument?.type || 'instrument'}
                  </span>
                </div>
              </motion.button>
            )
          })}
        </div>

        {/* Back button */}
        <button 
          onClick={onClose}
          className="w-full py-3 text-white/40 hover:text-white transition-colors"
        >
          ← Volver a las canciones
        </button>
      </motion.div>
    </div>
  )
}