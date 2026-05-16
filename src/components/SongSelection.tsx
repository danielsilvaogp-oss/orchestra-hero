'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '@/hooks/useGameStore'
import { supabase, Song } from '@/lib/supabase'
import { ALL_INSTRUMENTS } from '@/lib/instrument-keys'

interface SongSelectionProps {
  onTrackSelect?: () => void
}

export default function SongSelection({ onTrackSelect }: SongSelectionProps) {
  const { 
    setScreen, 
    songs, 
    setSongs, 
    selectedSong, 
    selectSong, 
    selectedInstrument,
    difficulty,
    setNotes
  } = useGameStore()

  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [songTracks, setSongTracks] = useState<any>(null)

  const instrumentConfig = selectedInstrument ? ALL_INSTRUMENTS[selectedInstrument] : null
  const instrumentColor = instrumentConfig?.color || '#d4af37'

  useEffect(() => {
    loadSongs()
  }, [selectedInstrument])

  async function loadSongs() {
    setLoading(true)
    try {
      let query = supabase
        .from('songs')
        .select('*')
        .order('title')

      if (selectedInstrument) {
        query = query.eq('instrument', selectedInstrument)
      }
      
      const { data, error } = await query
      
      if (data) {
        setSongs(data)
      }
    } catch (error) {
      console.error('Error loading songs:', error)
    }
    setLoading(false)
  }

  const filteredSongs = filter === 'all' 
    ? songs 
    : songs.filter(s => s.difficulty === filter)

  async function handleSongSelect(song: Song) {
    selectSong(song)
    
    // Instead of loading directly, go to instrument selector
    setScreen('playing')
    if (onTrackSelect) onTrackSelect()
  }

  return (
    <div className="min-h-screen bg-orchestra bg-grid p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={() => setScreen('menu')}
          className="text-white/60 hover:text-white transition-colors flex items-center gap-2"
        >
          ← Volver
        </button>
        
        <h2 className="font-display text-2xl md:text-3xl text-orchestra-gold">
          Selecciona una canción
        </h2>
        
        <div className="w-20" />
      </div>

      {/* Instrument badge */}
      {instrumentConfig && (
        <div className="flex items-center justify-center gap-3 mb-4">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: instrumentColor }}
          />
          <span className="text-white/80 font-medium">
            {instrumentConfig.name}
          </span>
          <span className="text-white/40 text-xs">
            ({instrumentConfig.type})
          </span>
        </div>
      )}

      {/* Difficulty filter */}
      <div className="flex justify-center gap-2 mb-6">
        {['all', 'beginner', 'intermediate', 'advanced', 'expert'].map((diff) => (
          <button
            key={diff}
            onClick={() => setFilter(diff)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === diff 
                ? 'bg-orchestra-gold text-orchestra-dark' 
                : 'bg-white/10 text-white/60 hover:bg-white/20'
            }`}
          >
            {diff === 'all' ? 'Todas' : diff.charAt(0).toUpperCase() + diff.slice(1)}
          </button>
        ))}
      </div>

      {/* Songs grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="spinner" />
        </div>
      ) : filteredSongs.length === 0 ? (
        <div className="text-center text-white/40 py-16">
          <p className="text-xl mb-4">No hay canciones para este instrumento</p>
          <p className="text-sm">Sube tu primera partitura MusicXML</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-6xl mx-auto">
          {filteredSongs.map((song, index) => {
            const songInst = ALL_INSTRUMENTS[song.instrument]
            return (
              <motion.div
                key={song.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleSongSelect(song)}
                className={`song-card ${selectedSong?.id === song.id ? 'selected' : ''}`}
                style={{
                  borderColor: selectedSong?.id === song.id ? instrumentColor : undefined
                }}
              >
                {/* Cover gradient */}
                <div 
                  className="h-16 rounded-lg mb-3 flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${songInst?.color || instrumentColor}40, ${songInst?.color || instrumentColor}10)`
                  }}
                >
                  <span className="text-2xl">♪</span>
                </div>

                {/* Info */}
                <h3 className="font-display text-base text-white mb-1 truncate">
                  {song.title}
                </h3>
                <p className="text-white/50 text-xs mb-2 truncate">
                  {song.composer}
                </p>

                {/* Meta */}
                <div className="flex items-center justify-between">
                  <span className={`difficulty-badge difficulty-${song.difficulty}`}>
                    {song.difficulty}
                  </span>
                  <span className="text-white/40 text-xs">
                    ♫ {song.tempo}
                  </span>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}