'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase, Song } from '@/lib/supabase'
import { ALL_INSTRUMENTS, getInstrumentDisplayInfo } from '@/lib/instrument-keys'

interface AdminPanelProps {
  onClose: () => void
}

export default function AdminPanel({ onClose }: AdminPanelProps) {
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  
  // Form state
  const [title, setTitle] = useState('')
  const [composer, setComposer] = useState('')
  const [instrument, setInstrument] = useState('violin')
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced' | 'expert'>('beginner')
  const [tempo, setTempo] = useState(120)
  const [category, setCategory] = useState('classical')
  
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Get instrument info for display
  const instrumentDisplay = getInstrumentDisplayInfo(instrument)
  const instrumentOptions = Object.entries(ALL_INSTRUMENTS)

  useEffect(() => {
    loadSongs()
  }, [])

  async function loadSongs() {
    setLoading(true)
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (data) setSongs(data)
    setLoading(false)
  }

  async function handleUpload() {
    if (!selectedFile || !title) {
      setMessage({ type: 'error', text: 'Selecciona un archivo y completa el título' })
      return
    }

    setUploading(true)
    setMessage(null)

    try {
      // Upload file to Supabase Storage
      const fileName = `${instrument}/${Date.now()}_${selectedFile.name}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('music')
        .upload(fileName, selectedFile)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('music')
        .getPublicUrl(fileName)

      // Save to database
      const { error: dbError } = await supabase
        .from('songs')
        .insert({
          title,
          composer: composer || 'Unknown',
          instrument,
          difficulty,
          tempo,
          category,
          musicxml_url: publicUrl
        })

      if (dbError) throw dbError

      setMessage({ type: 'success', text: 'Canción subida correctamente' })
      
      // Reset form
      setTitle('')
      setComposer('')
      setSelectedFile(null)
      loadSongs()
    } catch (error: any) {
      setMessage({ type: 'error', text: `Error: ${error.message}` })
    }

    setUploading(false)
  }

  async function handleDelete(songId: string) {
    if (!confirm('¿Estás seguro de eliminar esta canción?')) return

    const { error } = await supabase
      .from('songs')
      .delete()
      .eq('id', songId)

    if (!error) {
      loadSongs()
      setMessage({ type: 'success', text: 'Canción eliminada' })
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(true)
  }

  function handleDragLeave() {
    setDragOver(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      if (file.name.endsWith('.musicxml') || file.name.endsWith('.xml')) {
        setSelectedFile(file)
      } else {
        setMessage({ type: 'error', text: 'Solo se aceptan archivos MusicXML' })
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-orchestra-dark z-50 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-orchestra-dark-secondary border-b border-white/10 p-4 flex items-center justify-between z-10">
        <h1 className="font-display text-2xl text-orchestra-gold">Panel de Administración</h1>
        <button onClick={onClose} className="text-white/60 hover:text-white">
          ✕ Cerrar
        </button>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {/* Upload Form */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-6 mb-8"
        >
          <h2 className="font-display text-xl text-white mb-6">Subir Nueva Canción</h2>
          
          {/* File Drop Zone */}
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center mb-6 cursor-pointer transition-all ${
              dragOver 
                ? 'border-orchestra-gold bg-orchestra-gold/10' 
                : selectedFile 
                  ? 'border-green-500 bg-green-500/10'
                  : 'border-white/20 hover:border-white/40'
            }`}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <input 
              id="file-input"
              type="file" 
              accept=".musicxml,.xml"
              className="hidden"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            />
            
            {selectedFile ? (
              <div className="text-green-400">
                <div className="text-4xl mb-2">✓</div>
                <div>{selectedFile.name}</div>
                <div className="text-sm text-white/50">{(selectedFile.size / 1024).toFixed(1)} KB</div>
              </div>
            ) : (
              <div className="text-white/40">
                <div className="text-4xl mb-2">📄</div>
                <div>Arrastra tu archivo MusicXML aquí</div>
                <div className="text-sm">o haz clic para seleccionar</div>
              </div>
            )}
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-white/60 text-sm mb-2">Título *</label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-field"
                placeholder="Nombre de la canción"
              />
            </div>
            
            <div>
              <label className="block text-white/60 text-sm mb-2">Compositor</label>
              <input 
                type="text" 
                value={composer}
                onChange={(e) => setComposer(e.target.value)}
                className="input-field"
                placeholder="Compositor"
              />
            </div>

            <div>
              <label className="block text-white/60 text-sm mb-2">Instrumento</label>
              <select 
                value={instrument}
                onChange={(e) => setInstrument(e.target.value)}
                className="input-field"
              >
                <optgroup label="Cuerdas">
                  {instrumentOptions.filter(([_, v]) => v.type === 'strings').map(([key, inst]) => (
                    <option key={key} value={key}>{inst.name}</option>
                  ))}
                </optgroup>
                <optgroup label="Vientos">
                  {instrumentOptions.filter(([_, v]) => v.type === 'winds').map(([key, inst]) => (
                    <option key={key} value={key}>{inst.name}</option>
                  ))}
                </optgroup>
                <optgroup label="Percusión">
                  {instrumentOptions.filter(([_, v]) => v.type === 'percussion').map(([key, inst]) => (
                    <option key={key} value={key}>{inst.name}</option>
                  ))}
                </optgroup>
                <optgroup label="Teclado">
                  {instrumentOptions.filter(([_, v]) => v.type === 'keyboard').map(([key, inst]) => (
                    <option key={key} value={key}>{inst.name}</option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div>
              <label className="block text-white/60 text-sm mb-2">Dificultad</label>
              <select 
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="input-field"
              >
                <option value="beginner">Principiante</option>
                <option value="intermediate">Intermedio</option>
                <option value="advanced">Avanzado</option>
                <option value="expert">Experto</option>
              </select>
            </div>

            <div>
              <label className="block text-white/60 text-sm mb-2">Tempo (BPM)</label>
              <input 
                type="number" 
                value={tempo}
                onChange={(e) => setTempo(parseInt(e.target.value) || 120)}
                className="input-field"
                min="40"
                max="300"
              />
            </div>

            <div>
              <label className="block text-white/60 text-sm mb-2">Categoría</label>
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input-field"
              >
                <option value="classical">Clásica</option>
                <option value="baroque">Barroco</option>
                <option value="romantic">Romántico</option>
                <option value="modern">Moderno</option>
                <option value="folk">Folklore</option>
                <option value="pop">Pop/Jazz</option>
              </select>
            </div>
          </div>

          {/* Instrument preview */}
          {instrumentDisplay && (
            <div className="bg-black/20 rounded-lg p-3 mb-4 text-sm">
              <p className="text-white/60 mb-2">{instrumentDisplay.description}</p>
              <div className="flex gap-4">
                {instrumentDisplay.lanes.map((lane, i) => (
                  <span key={i} className="text-white/40">
                    <span className="text-white font-bold">{lane.key}:</span> {lane.note}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Message */}
          <AnimatePresence>
            {message && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`mb-4 p-3 rounded-lg ${
                  message.type === 'success' 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-red-500/20 text-red-400'
                }`}
              >
                {message.text}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Button */}
          <button 
            onClick={handleUpload}
            disabled={uploading || !selectedFile || !title}
            className={`btn-gold w-full ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {uploading ? 'Subiendo...' : 'Subir Canción'}
          </button>
        </motion.div>

        {/* Songs List */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-xl p-6"
        >
          <h2 className="font-display text-xl text-white mb-6">
            Canciones ({songs.length})
          </h2>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="spinner" />
            </div>
          ) : songs.length === 0 ? (
            <div className="text-center text-white/40 py-8">
              No hay canciones todavía
            </div>
          ) : (
            <div className="space-y-3">
              {songs.map((song) => {
                const inst = ALL_INSTRUMENTS[song.instrument]
                return (
                  <motion.div
                    key={song.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-between bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: inst?.color || '#666' }}
                      />
                      <div>
                        <div className="text-white font-medium">{song.title}</div>
                        <div className="text-white/40 text-sm">
                          {song.composer} • {inst?.name || song.instrument} • {song.tempo} BPM
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className={`difficulty-badge difficulty-${song.difficulty}`}>
                        {song.difficulty}
                      </span>
                      <button
                        onClick={() => handleDelete(song.id)}
                        className="text-red-400 hover:text-red-300 p-2"
                        title="Eliminar"
                      >
                        🗑️
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}