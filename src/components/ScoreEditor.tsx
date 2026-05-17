'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { OCRExtractedNote } from '@/lib/music-ocr-bridge'

interface ScoreEditorProps {
  notes: OCRExtractedNote[]
  metadata?: any
  onClose?: () => void
  onExportMidi?: (notes: OCRExtractedNote[]) => void
  onExportMusicXML?: (notes: OCRExtractedNote[]) => void
  onImportToGame?: (notes: OCRExtractedNote[]) => void
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

const DURATIONS = [
  { value: 2000, label: 'Redonda', icon: '𝅝' },
  { value: 1000, label: 'Blanca', icon: '𝅗𝅥' },
  { value: 500, label: 'Negra', icon: '♩' },
  { value: 250, label: 'Corchea', icon: '♪' },
  { value: 125, label: 'Semicorchea', icon: '𝅘𝅥𝅯' },
]

export default function ScoreEditor({ 
  notes: initialNotes, 
  metadata, 
  onClose,
  onExportMidi,
  onExportMusicXML,
  onImportToGame 
}: ScoreEditorProps) {
  const [instrument, setInstrument] = useState('viola')
  const [selectedNote, setSelectedNote] = useState<number | null>(null)
  const [notes, setNotes] = useState<OCRExtractedNote[]>(initialNotes)

  const filteredNotes = useMemo(() => {
    return notes.filter(note => {
      if (instrument === 'viola') {
        return note.midi >= 48 && note.midi <= 88
      }
      return true
    })
  }, [notes, instrument])

  function handleNoteClick(idx: number) {
    setSelectedNote(selectedNote === idx ? null : idx)
  }

  function handlePitchChange(direction: 'up' | 'down') {
    if (selectedNote === null) return
    
    const newNotes = [...notes]
    newNotes[selectedNote] = {
      ...newNotes[selectedNote],
      midi: newNotes[selectedNote].midi + (direction === 'up' ? 1 : -1),
      pitch: getPitchFromMidi(newNotes[selectedNote].midi + (direction === 'up' ? 1 : -1))
    }
    setNotes(newNotes)
  }

  function handleDurationChange(duration: number) {
    if (selectedNote === null) return
    
    const newNotes = [...notes]
    newNotes[selectedNote] = {
      ...newNotes[selectedNote],
      duration
    }
    setNotes(newNotes)
  }

  function getPitchFromMidi(midi: number): string {
    const noteIndex = midi % 12
    const octave = Math.floor(midi / 12) - 1
    return `${NOTE_NAMES[noteIndex]}${octave}`
  }

  function handleDeleteNote() {
    if (selectedNote === null) return
    const newNotes = notes.filter((_, i) => i !== selectedNote)
    setNotes(newNotes)
    setSelectedNote(null)
  }

  function handleAddNote() {
    const newNote: OCRExtractedNote = {
      pitch: 'C4',
      midi: 60,
      startTime: notes.length * 500,
      duration: 500,
      measure: Math.floor(notes.length / 4) + 1,
      beat: (notes.length % 4) + 1,
      confidence: 1
    }
    setNotes([...notes, newNote])
    setSelectedNote(notes.length)
  }

  function generateMusicXML(): string {
    const ns = 'http://www.musicxml.org/schema/MusicXML'
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1" xmlns="${ns}">
  <work><work-title>${metadata?.title || 'Edited Score'}</work-title></work>
  <identification><creator type="composer">Music Trainer</creator></identification>
  <defaults><sound tempo="120"/></defaults>
  <part-list><score-part id="P1"><part-name>${instrument}</part-name></score-part></part-list>
  <part id="P1">`

    const measures = new Map<number, OCRExtractedNote[]>()
    notes.forEach(note => {
      const m = note.measure || 1
      if (!measures.has(m)) measures.set(m, [])
      measures.get(m)!.push(note)
    })

    const sortedMeasures = Array.from(measures.keys()).sort((a, b) => a - b)
    
    sortedMeasures.forEach(measureNum => {
      const mNotes = measures.get(measureNum)!
      mNotes.sort((a, b) => a.startTime - b.startTime)
      
      xml += `\n    <measure number="${measureNum}">`
      
      mNotes.forEach(note => {
        const step = note.pitch[0]
        const octave = parseInt(note.pitch.match(/\d+/)?.[0] || '4')
        const dur = note.duration >= 1000 ? 'whole' : note.duration >= 500 ? 'half' : note.duration >= 250 ? 'quarter' : 'eighth'
        
        xml += `\n      <note><pitch><step>${step}</step><octave>${octave}</octave></pitch><duration>${Math.round(note.duration / 250)}</duration><type>${dur}</type></note>`
      })
      
      xml += '\n    </measure>'
    })

    xml += '\n  </part>\n</score-partwise>'
    return xml
  }

  function generateMidi(): Uint8Array {
    const PPQ = 480
    const events: number[] = []
    let time = 0
    
    notes.forEach(note => {
      const startTicks = Math.round((note.startTime / 1000) * PPQ)
      const durTicks = Math.round((note.duration / 1000) * PPQ)
      
      events.push(0x90, note.midi, 0x40)
      events.push(...varLength(startTicks), ...varLength(durTicks), 0x80, note.midi, 0x00)
    })

    const header = [0x4D, 0x54, 0x68, 0x64, 0, 0, 0, 6, 0, 1, 0, 1, 0, 0x80]
    const trackData = events.flat()
    const trackHeader = [0x4D, 0x54, 0x72, 0x6B, ...uint32(trackData.length), ...trackData]
    
    return new Uint8Array([...header, ...trackHeader])
  }

  function varLength(value: number): number[] {
    const bytes: number[] = []
    bytes.push(value & 0x7F)
    while (value > 127) {
      value >>= 7
      bytes.unshift((value & 0x7F) | 0x80)
    }
    return bytes
  }

  function uint32(value: number): number[] {
    return [(value >> 24) & 0xFF, (value >> 16) & 0xFF, (value >> 8) & 0xFF, value & 0xFF]
  }

  function handleExportMidi() {
    const midi = generateMidi()
    const blob = new Blob([midi.buffer], { type: 'audio/midi' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'score.mid'
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleExportMusicXML() {
    const xml = generateMusicXML()
    const blob = new Blob([xml], { type: 'application/xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'score.musicxml'
    a.click()
    URL.revokeObjectURL(url)
  }

  function handlePlay() {
    if (onImportToGame) {
      onImportToGame(notes)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-6xl bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl flex flex-col h-[90vh]"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-display text-white">✏️ Editor de Partitura</h2>
            <div className="flex gap-2">
              <button onClick={handleAddNote} className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white rounded text-sm">
                + Nota
              </button>
              <button onClick={handleExportMidi} className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm">
                📀 Exportar MIDI
              </button>
              <button onClick={handleExportMusicXML} className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-sm">
                📄 Exportar MusicXML
              </button>
              <button onClick={handlePlay} className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white rounded text-sm">
                🎮 Practicar
              </button>
              <button onClick={onClose} className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm">
                Cerrar
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Notes grid */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {filteredNotes.map((note, idx) => (
                <motion.button
                  key={idx}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleNoteClick(idx)}
                  className={`
                    p-3 rounded-xl border-2 flex flex-col items-center transition-all
                    ${selectedNote === idx 
                      ? 'bg-purple-600 border-purple-400' 
                      : 'bg-slate-800 border-slate-700 hover:border-slate-500'}
                  `}
                >
                  <div className="text-2xl font-bold text-white">
                    {note.pitch.replace(/\d/, '')}
                  </div>
                  <div className="text-xs text-slate-400">{note.pitch.match(/\d/)?.[0]}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    {note.duration >= 1000 ? '𝅝' : note.duration >= 500 ? '♩' : '♪'}
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Editor panel */}
          {selectedNote !== null && (
            <div className="w-72 bg-slate-800 p-4 border-l border-slate-700">
              <h3 className="text-white font-bold mb-4">Nota: {notes[selectedNote].pitch}</h3>
              
              {/* Pitch controls */}
              <div className="mb-4">
                <label className="text-slate-400 text-sm block mb-2">Editar tono:</label>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handlePitchChange('down')}
                    className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded"
                  >
                    ▼ Bajar
                  </button>
                  <button 
                    onClick={() => handlePitchChange('up')}
                    className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded"
                  >
                    ▲ Subir
                  </button>
                </div>
              </div>

              {/* Duration controls */}
              <div className="mb-4">
                <label className="text-slate-400 text-sm block mb-2">Figura musical:</label>
                <div className="grid grid-cols-2 gap-2">
                  {DURATIONS.map(dur => (
                    <button
                      key={dur.value}
                      onClick={() => handleDurationChange(dur.value)}
                      className={`
                        py-2 rounded text-sm font-bold
                        ${notes[selectedNote].duration === dur.value
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}
                      `}
                    >
                      {dur.icon} {dur.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Info */}
              <div className="text-slate-400 text-sm space-y-1">
                <p>Compás: {notes[selectedNote].measure}</p>
                <p>Tiempo: {notes[selectedNote].beat}</p>
                <p>MIDI: {notes[selectedNote].midi}</p>
              </div>

              {/* Delete */}
              <button 
                onClick={handleDeleteNote}
                className="w-full mt-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded"
              >
                🗑 Eliminar nota
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}