'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { OCRExtractedNote } from '@/lib/music-ocr-bridge'

interface ScoreViewerProps {
  musicxml: string
  title?: string
  onClose: () => void
  onImport?: () => void
}

// Parse MusicXML to get notes
function parseMusicXML(xmlString: string): OCRExtractedNote[] {
  const notes: OCRExtractedNote[] = []
  
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(xmlString, 'text/xml')
    
    const noteElements = doc.querySelectorAll('note')
    let startTime = 0
    
    noteElements.forEach((noteEl, index) => {
      const pitchEl = noteEl.querySelector('pitch')
      if (!pitchEl) return
      
      const step = pitchEl.querySelector('step')?.textContent || 'C'
      const octave = parseInt(pitchEl.querySelector('octave')?.textContent || '4')
      const alter = pitchEl.querySelector('alter')?.textContent
      
      const pitch = alter === '1' || alter === '#' 
        ? `${step}#${octave}` 
        : `${step}${octave}`
      
      const stepToMidi: Record<string, number> = {
        'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11
      }
      const midi = (octave + 1) * 12 + (stepToMidi[step] || 0)
      
      const measureEl = noteEl.closest('measure')
      const measure = parseInt(measureEl?.getAttribute('number') || '1')
      
      notes.push({
        pitch,
        midi,
        startTime,
        duration: 500,
        measure,
        beat: (index % 4) + 1,
        confidence: 1
      })
      
      startTime += 500
    })
  } catch (e) {
    console.error('XML parse error:', e)
  }
  
  return notes
}

// Simple visual staff rendering
function renderStaffLine(lineNum: number): string {
  const lines = ['E', 'G', 'B', 'D', 'F']
  return lines[lineNum] || ''
}

function getNotePosition(midi: number): { line: number, isBlack: boolean } {
  const notePositions: Record<string, number> = {
    'C4': 0, 'D4': 1, 'E4': 2, 'F4': 3, 'G4': 4, 'A4': 5, 'B4': 6,
    'C5': 7, 'D5': 8, 'E5': 9, 'F5': 10, 'G5': 11, 'A5': 12, 'B5': 13,
    'C3': -7, 'D3': -6, 'E3': -5, 'F3': -4, 'G3': -3, 'A3': -2, 'B3': -1
  }
  
  // Find closest note
  let closest = 'C4'
  let minDist = 100
  
  Object.keys(notePositions).forEach(note => {
    const dist = Math.abs(midi - (parseInt(note.slice(-1)) * 12 + notePositions[note]))
    if (dist < minDist) {
      minDist = dist
      closest = note
    }
  })
  
  const isBlack = closest.includes('#')
  const baseLine = notePositions[closest] || 0
  
  return { line: baseLine, isBlack }
}

export default function ScoreViewer({ musicxml, title, onClose, onImport }: ScoreViewerProps) {
  const [notes] = useState<OCRExtractedNote[]>(() => parseMusicXML(musicxml))

  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  
  // Group notes by measure
  const measures = new Map<number, OCRExtractedNote[]>()
  notes.forEach(note => {
    const m = note.measure || 1
    if (!measures.has(m)) measures.set(m, [])
    measures.get(m)!.push(note)
  })

  const sortedMeasures = Array.from(measures.keys()).sort((a, b) => a - b)

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/90 z-50 overflow-y-auto"
    >
      <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-white">
            🎼 {title || 'Partitura'}
          </h1>
          <p className="text-slate-400 text-sm">{notes.length} notas detectadas</p>
        </div>
        <div className="flex gap-3">
          {onImport && (
            <button
              onClick={onImport}
              className="px-5 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl font-semibold"
            >
              🎮 Jugar
            </button>
          )}
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-700 text-white rounded-xl hover:bg-slate-600"
          >
            ✕ Cerrar
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {/* Staff rendering */}
        <div className="bg-white rounded-xl p-6 overflow-x-auto">
          {sortedMeasures.map((measureNum) => (
            <div key={measureNum} className="mb-8">
              <div className="text-slate-500 text-sm mb-2 font-bold">Compás {measureNum}</div>
              
              {/* Staff lines */}
              <div className="relative h-24 border-l-2 border-black">
                {/* 5 staff lines */}
                {[0, 1, 2, 3, 4].map((i) => (
                  <div 
                    key={i} 
                    className="absolute w-full h-px bg-black"
                    style={{ top: `${i * 20 + 10}px` }}
                  />
                ))}
                
                {/* Treble clef */}
                <div className="absolute left-2 top-0 text-5xl">𝄞</div>
                
                {/* Notes */}
                {measures.get(measureNum)!.map((note, idx) => {
                  const pos = getNotePosition(note.midi)
                  const yPos = 50 - (pos.line * 5) // Convert to pixel position
                  const isLedger = pos.line < -2 || pos.line > 12
                  
                  return (
                    <div
                      key={idx}
                      className="absolute flex flex-col items-center"
                      style={{ 
                        left: `${60 + idx * 40}px`,
                        top: `${yPos}px`
                      }}
                    >
                      {/* Ledger lines if needed */}
                      {pos.line < 0 && Array.from({ length: Math.abs(pos.line) - 1 }).map((_, i) => (
                        <div key={i} className="w-8 h-px bg-black mb-1" />
                      ))}
                      {pos.line > 10 && Array.from({ length: pos.line - 10 }).map((_, i) => (
                        <div key={i} className="w-8 h-px bg-black mb-1" />
                      ))}
                      
                      {/* Note head */}
                      <div className={`
                        w-6 h-5 rounded-full border-2 border-black
                        ${pos.isBlack ? 'bg-black' : 'bg-white'}
                      `} />
                      
                      {/* Note name */}
                      <span className="text-xs text-slate-600 mt-1">
                        {note.pitch}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
          
          {notes.length === 0 && (
            <div className="text-center text-slate-500 py-8">
              No se pudieron parsear las notas del MusicXML
            </div>
          )}
        </div>
        
        {/* Note list */}
        <div className="mt-6 bg-slate-800 rounded-xl p-4">
          <h3 className="text-white font-bold mb-3">Notas detectadas:</h3>
          <div className="flex flex-wrap gap-2">
            {notes.map((note, idx) => (
              <span 
                key={idx}
                className="px-3 py-1 bg-slate-700 text-white rounded-full text-sm"
              >
                {note.pitch}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}