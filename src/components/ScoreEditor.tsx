'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { OCRExtractedNote } from '@/lib/music-ocr-bridge'

interface ScoreEditorProps {
  notes: OCRExtractedNote[]
  metadata?: any
  onExportMidi?: (notes: OCRExtractedNote[]) => void
  onExportMusicXML?: (notes: OCRExtractedNote[]) => void
  onImportToGame?: (notes: OCRExtractedNote[]) => void
  onClose?: () => void
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

const OCTAVES = [2, 3, 4, 5, 6, 7]

const TEMPOS = [60, 80, 100, 120, 140, 160]

export default function ScoreEditor({ 
  notes: initialNotes, 
  metadata,
  onExportMidi,
  onExportMusicXML,
  onImportToGame,
  onClose 
}: ScoreEditorProps) {
  const [notes, setNotes] = useState<OCRExtractedNote[]>(initialNotes)
  const [selectedNoteIndex, setSelectedNoteIndex] = useState<number | null>(null)
  const [tempo, setTempo] = useState(120)
  const [instrument, setInstrument] = useState('violin')
  const [view, setView] = useState<'list' | 'timeline'>('list')
  const [filterMeasure, setFilterMeasure] = useState<number | null>(null)
  const [searchPitch, setSearchPitch] = useState('')

  const filteredNotes = notes.filter(note => {
    if (filterMeasure && note.measure !== filterMeasure) return false
    if (searchPitch && !note.pitch.toLowerCase().includes(searchPitch.toLowerCase())) return false
    return true
  })

  const measures = Array.from(new Set(notes.map(n => n.measure))).sort((a, b) => a - b)

  const addNote = useCallback(() => {
    const newNote: OCRExtractedNote = {
      pitch: 'C4',
      midi: 60,
      startTime: notes.length > 0 ? notes[notes.length - 1].startTime + 500 : 0,
      duration: 500,
      measure: notes.length > 0 ? notes[notes.length - 1].measure + 1 : 1,
      beat: 1,
      confidence: 1.0
    }
    setNotes([...notes, newNote])
    setSelectedNoteIndex(notes.length)
  }, [notes])

  const updateNote = useCallback((index: number, updates: Partial<OCRExtractedNote>) => {
    setNotes(prev => prev.map((note, i) => 
      i === index ? { ...note, ...updates } : note
    ))
  }, [])

  const deleteNote = useCallback((index: number) => {
    setNotes(prev => prev.filter((_, i) => i !== index))
    setSelectedNoteIndex(null)
  }, [])

  const moveNote = useCallback((index: number, direction: 'up' | 'down' | 'left' | 'right') => {
    const note = notes[index]
    let newNote = { ...note }

    switch (direction) {
      case 'up':
        newNote.midi = Math.min(127, note.midi + 1)
        newNote.pitch = midiToPitch(newNote.midi)
        break
      case 'down':
        newNote.midi = Math.max(0, note.midi - 1)
        newNote.pitch = midiToPitch(newNote.midi)
        break
      case 'left':
        newNote.startTime = Math.max(0, note.startTime - 250)
        newNote.beat = Math.max(1, note.beat - 1)
        if (newNote.beat < 1) {
          newNote.measure = Math.max(1, note.measure - 1)
          newNote.beat = 4
        }
        break
      case 'right':
        newNote.startTime = note.startTime + 250
        newNote.beat = Math.min(4, note.beat + 1)
        if (newNote.beat > 4) {
          newNote.measure = note.measure + 1
          newNote.beat = 1
        }
        break
    }

    updateNote(index, newNote)
  }, [notes, updateNote])

  const duplicateNote = useCallback((index: number) => {
    const note = notes[index]
    const newNote: OCRExtractedNote = {
      ...note,
      startTime: note.startTime + 500,
      measure: note.beat >= 4 ? note.measure + 1 : note.measure,
      beat: note.beat >= 4 ? 1 : note.beat + 1
    }
    const newNotes = [...notes]
    newNotes.splice(index + 1, 0, newNote)
    setNotes(newNotes)
  }, [notes])

  const handleExportMidi = () => {
    if (onExportMidi) {
      onExportMidi(notes)
    } else {
      generateAndDownloadMidi(notes, tempo, instrument)
    }
  }

  const handleExportMusicXML = () => {
    if (onExportMusicXML) {
      onExportMusicXML(notes)
    } else {
      const xml = generateMusicXML(notes, tempo, instrument)
      downloadFile(xml, `${metadata?.title || 'score'}.xml`, 'application/xml')
    }
  }

  const handleImportToGame = () => {
    if (onImportToGame) {
      onImportToGame(notes)
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/95 flex flex-col z-50">
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">
            ← Volver
          </button>
          <h2 className="text-2xl font-bold text-white">Editor de Partitura</h2>
          <span className="text-slate-400 text-sm">
            {notes.length} notas detectadas
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2">
            <span className="text-slate-400 text-sm">Tempo:</span>
            <select 
              value={tempo} 
              onChange={(e) => setTempo(Number(e.target.value))}
              className="bg-transparent text-white font-bold"
            >
              {TEMPOS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <span className="text-slate-500 text-xs">BPM</span>
          </div>

          <select 
            value={instrument}
            onChange={(e) => setInstrument(e.target.value)}
            className="bg-slate-800 text-white rounded-lg px-3 py-2"
          >
            <option value="violin">Violín</option>
            <option value="viola">Viola</option>
            <option value="cello">Violonchelo</option>
            <option value="flute">Flauta</option>
            <option value="oboe">Oboe</option>
            <option value="clarinet">Clarinete</option>
            <option value="trumpet">Trompeta</option>
            <option value="piano">Piano</option>
          </select>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-80 border-r border-slate-700 flex flex-col">
          <div className="p-4 border-b border-slate-700">
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setView('list')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                  view === 'list' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                Lista
              </button>
              <button
                onClick={() => setView('timeline')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                  view === 'timeline' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                Línea
              </button>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Buscar nota..."
                value={searchPitch}
                onChange={(e) => setSearchPitch(e.target.value)}
                className="flex-1 bg-slate-800 text-white rounded-lg px-3 py-2 text-sm"
              />
              <select
                value={filterMeasure || ''}
                onChange={(e) => setFilterMeasure(e.target.value ? Number(e.target.value) : null)}
                className="bg-slate-800 text-white rounded-lg px-2 py-2 text-sm"
              >
                <option value="">Compás</option>
                {measures.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {filteredNotes.map((note, index) => (
              <motion.div
                key={index}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3 rounded-lg mb-2 cursor-pointer transition-colors ${
                  selectedNoteIndex === index 
                    ? 'bg-purple-600/50 border border-purple-500' 
                    : 'bg-slate-800 hover:bg-slate-700'
                }`}
                onClick={() => setSelectedNoteIndex(index)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className={`text-2xl font-bold ${
                      note.confidence > 0.8 ? 'text-green-400' :
                      note.confidence > 0.5 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {note.pitch}
                    </span>
                    <span className="text-slate-400 text-sm ml-2">
                      Compás {note.measure}, Tiempo {note.beat}
                    </span>
                  </div>
                  <div className="text-slate-500 text-xs">
                    {Math.round(note.duration)}ms
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="p-4 border-t border-slate-700">
            <button
              onClick={addNote}
              className="w-full py-3 bg-green-600/20 border border-green-500 text-green-400 rounded-lg font-semibold hover:bg-green-600/30"
            >
              + Agregar Nota
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          {selectedNoteIndex !== null && (
            <div className="p-4 bg-slate-800/50 border-b border-slate-700">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <span className="text-slate-400">Nota:</span>
                  <select
                    value={notes[selectedNoteIndex].pitch.replace(/[0-9]/g, '')}
                    onChange={(e) => {
                      const octave = parseInt(notes[selectedNoteIndex].pitch.match(/\d+/)?.[0] || '4')
                      updateNote(selectedNoteIndex, { 
                        pitch: e.target.value + octave,
                        midi: pitchToMidi(e.target.value + octave)
                      })
                    }}
                    className="bg-slate-700 text-white rounded-lg px-3 py-2"
                  >
                    {NOTE_NAMES.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                  <select
                    value={parseInt(notes[selectedNoteIndex].pitch.match(/\d+/)?.[0] || '4')}
                    onChange={(e) => {
                      const noteName = notes[selectedNoteIndex].pitch.replace(/[0-9]/g, '')
                      updateNote(selectedNoteIndex, { 
                        pitch: noteName + e.target.value,
                        midi: pitchToMidi(noteName + e.target.value)
                      })
                    }}
                    className="bg-slate-700 text-white rounded-lg px-3 py-2"
                  >
                    {OCTAVES.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-slate-400">Duración:</span>
                  <input
                    type="number"
                    value={notes[selectedNoteIndex].duration}
                    onChange={(e) => updateNote(selectedNoteIndex, { duration: Number(e.target.value) })}
                    className="bg-slate-700 text-white rounded-lg px-3 py-2 w-24"
                    min={100}
                    max={2000}
                    step={100}
                  />
                  <span className="text-slate-500 text-xs">ms</span>
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    onClick={() => moveNote(selectedNoteIndex, 'up')}
                    className="p-2 bg-slate-700 hover:bg-slate-600 rounded text-white"
                    title="Subir nota"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveNote(selectedNoteIndex, 'down')}
                    className="p-2 bg-slate-700 hover:bg-slate-600 rounded text-white"
                    title="Bajar nota"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => moveNote(selectedNoteIndex, 'left')}
                    className="p-2 bg-slate-700 hover:bg-slate-600 rounded text-white"
                    title="Antes"
                  >
                    ←
                  </button>
                  <button
                    onClick={() => moveNote(selectedNoteIndex, 'right')}
                    className="p-2 bg-slate-700 hover:bg-slate-600 rounded text-white"
                    title="Después"
                  →
                  </button>
                  <button
                    onClick={() => duplicateNote(selectedNoteIndex)}
                    className="p-2 bg-slate-700 hover:bg-slate-600 rounded text-white"
                    title="Duplicar"
                  >
                    ⧉
                  </button>
                  <button
                    onClick={() => deleteNote(selectedNoteIndex)}
                    className="p-2 bg-red-600/50 hover:bg-red-600 rounded text-white"
                    title="Eliminar"
                  >
                    🗑
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 p-4 overflow-auto">
            <div className="bg-slate-800/50 rounded-xl p-6">
              <h3 className="text-white font-semibold mb-4">Vista previa de compases</h3>
              <div className="space-y-4">
                {measures.slice(0, 8).map(measure => (
                  <div key={measure} className="bg-slate-700/50 rounded-lg p-3">
                    <div className="text-slate-400 text-sm mb-2">Compás {measure}</div>
                    <div className="flex flex-wrap gap-2">
                      {notes.filter(n => n.measure === measure).map((note, idx) => {
                        const originalIndex = notes.indexOf(note)
                        return (
                          <button
                            key={idx}
                            onClick={() => setSelectedNoteIndex(originalIndex)}
                            className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg ${
                              selectedNoteIndex === originalIndex 
                                ? 'bg-purple-600 text-white' 
                                : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                            }`}
                          >
                            {note.pitch}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-slate-700 flex items-center justify-between">
            <div className="text-slate-400 text-sm">
              {filteredNotes.length} de {notes.length} notas mostradas
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleExportMidi}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold flex items-center gap-2"
              >
                ⬇️ Exportar MIDI
              </button>
              <button
                onClick={handleExportMusicXML}
                className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold flex items-center gap-2"
              >
                📄 Exportar MusicXML
              </button>
              <button
                onClick={handleImportToGame}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold flex items-center gap-2"
              >
                🎮 Importar al Juego
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function midiToPitch(midi: number): string {
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  const octave = Math.floor(midi / 12) - 1
  return `${notes[midi % 12]}${octave}`
}

function pitchToMidi(pitch: string): number {
  const noteMap: Record<string, number> = {
    'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
    'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
    'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
  }
  const match = pitch.match(/([A-G]#?)(\d+)/)
  if (!match) return 60
  const note = match[1]
  const octave = parseInt(match[2])
  return (octave + 1) * 12 + (noteMap[note] || 0)
}

function generateMusicXML(notes: OCRExtractedNote[], tempo: number, instrument: string): string {
  const ns = 'http://www.musicxml.org/schema/MusicXML'
  const beatDuration = 60000 / tempo

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1" xmlns="${ns}">
  <work>
    <work-title>Partitura Editada</work-title>
  </work>
  <identification>
    <creator type="composer">Orquestra Hero</creator>
  </identification>
  <defaults>
    <sound tempo="${tempo}"/>
  </defaults>
  <part-list>
    <score-part id="P1">
      <part-name>${instrument}</part-name>
    </score-part>
  </part-list>
  <part id="P1">`

  const measures = new Map<number, OCRExtractedNote[]>()
  notes.forEach(note => {
    const m = note.measure || 1
    if (!measures.has(m)) measures.set(m, [])
    measures.get(m)!.push(note)
  })

  const sortedMeasures = Array.from(measures.keys()).sort((a, b) => a - b)
  
  sortedMeasures.forEach(m => {
    const mNotes = measures.get(m)!.sort((a, b) => a.startTime - b.startTime)
    xml += `\n    <measure number="${m}">`
    
    mNotes.forEach(note => {
      const duration = Math.max(1, Math.round(note.duration / beatDuration * 4))
      const step = note.pitch.replace(/\d+/, '')
      const octave = note.pitch.match(/\d+/)?.[0] || '4'
      
      xml += `
      <note>
        <pitch>
          <step>${step}</step>
          <octave>${octave}</octave>
        </pitch>
        <duration>${duration}</duration>
        <type>quarter</type>
      </note>`
    })
    
    xml += '\n    </measure>'
  })

  xml += '\n  </part>\n</score-partwise>'
  return xml
}

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function generateAndDownloadMidi(notes: OCRExtractedNote[], tempo: number, instrument: string) {
  // Simple MIDI generation (basic implementation)
  // For full MIDI support, consider using 'jsmid' or similar library
  
  const PPQ = 480
  const microsecondsPerBeat = 60000000 / tempo
  
  const tracks: number[][] = []
  let currentTime = 0
  
  // Sort notes by start time
  const sortedNotes = [...notes].sort((a, b) => a.startTime - b.startTime)
  
  sortedNotes.forEach(note => {
    const startTicks = Math.round((note.startTime / 1000) * (microsecondsPerBeat / 1000) * PPQ / 60000)
    const durationTicks = Math.round((note.duration / 1000) * (microsecondsPerBeat / 1000) * PPQ / 60000)
    
    // MIDI event: Note On
    tracks.push([
      0x90 | 0, // Channel 0
      note.midi,
      0x40, // Velocity
      ...varLength(startTicks),
      ...varLength(durationTicks),
      0x80 | 0, // Note Off
      note.midi,
      0x00
    ])
  })

  // Build MIDI file
  const header = [0x4D, 0x54, 0x68, 0x64, 0x00, 0x00, 0x00, 0x06, 0x00, 0x01, 0x00, 0x01, 0x00, 0x80]
  
  const trackData = tracks.flat()
  const trackChunk = [
    0x4D, 0x54, 0x72, 0x6B,
    ...uint32(trackData.length),
    ...trackData
  ]

  const midiData = new Uint8Array([...header, ...trackChunk])
  const blob = new Blob([Array.from(midiData)], { type: 'audio/midi' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'score.mid'
  a.click()
  URL.revokeObjectURL(url)
}

function varLength(value: number): number[] {
  const bytes: number[] = []
  let v = value
  bytes.push(v & 0x7F)
  while (v > 127) {
    v >>= 7
    bytes.unshift((v & 0x7F) | 0x80)
  }
  return bytes
}

function uint32(value: number): number[] {
  return [
    (value >> 24) & 0xFF,
    (value >> 16) & 0xFF,
    (value >> 8) & 0xFF,
    value & 0xFF
  ]
}