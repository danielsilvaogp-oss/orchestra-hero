// ScoreEditor.tsx
'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { OCRExtractedNote } from '@/lib/music-ocr-bridge'

interface ScoreEditorProps {
  notes: OCRExtractedNote[]
  metadata?: any
  onClose?: () => void
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

export default function ScoreEditor({ notes: initialNotes, metadata, onClose }: ScoreEditorProps) {
  const [instrument, setInstrument] = useState('viola')
  
  // FILTRO INTELIGENTE: Rango físico estricto
  const filteredNotes = useMemo(() => {
    return initialNotes.filter(note => {
      if (instrument === 'viola') {
        // C3 (48) a E6 (88). Borra texto y ruido fuera del pentagrama.
        const isInRange = note.midi >= 48 && note.midi <= 88;
        return isInRange && note.confidence > 0.65;
      }
      return note.confidence > 0.5;
    });
  }, [initialNotes, instrument]);

  const [notes, setNotes] = useState<OCRExtractedNote[]>(filteredNotes)

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-5xl bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl flex flex-col h-[85vh]"
      >
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/80">
          <h2 className="text-xl font-display text-white">
            Editor IA: {metadata?.title || 'Partitura'}
          </h2>
          <div className="flex gap-4">
            <select 
              value={instrument} 
              onChange={(e) => setInstrument(e.target.value)}
              className="bg-slate-800 text-white rounded px-3 py-1 border border-slate-700"
            >
              <option value="viola">Viola (Clave Do)</option>
              <option value="violin">Violín (Clave Sol)</option>
              <option value="cello">Cello (Clave Fa)</option>
            </select>
            <button onClick={onClose} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors">
              Cerrar
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {notes.map((note, idx) => (
              <div key={idx} className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div className="text-2xl font-bold text-white">
                    {NOTE_NAMES[note.midi % 12]}<span className="text-sm text-slate-400">{Math.floor(note.midi / 12) - 1}</span>
                  </div>
                  <div className="text-xs px-2 py-1 bg-green-900/30 text-green-400 rounded-full border border-green-500/30">
                    Conf: {Math.round(note.confidence * 100)}%
                  </div>
                </div>
                <div className="text-slate-400 text-sm">MIDI: {note.midi}</div>
              </div>
            ))}
            {notes.length === 0 && (
              <div className="col-span-full text-center py-12 text-slate-500">
                La IA ha filtrado el texto y no encontró notas válidas.
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
