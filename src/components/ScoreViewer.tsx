'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

interface ScoreViewerProps {
  musicxml: string
  title?: string
  onClose: () => void
  onImport?: () => void
}

interface ParsedNote {
  keys: string
  duration: string
  type: string
}

export default function ScoreViewer({ musicxml, title, onClose, onImport }: ScoreViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function renderScore() {
      if (!containerRef.current) return
      
      try {
        setIsLoading(true)
        setError(null)
        
        const VF = await import('vexflow')
        const { Renderer, Stave, StaveNote, Voice, Formatter, Accidental } = VF
        
        containerRef.current.innerHTML = ''
        
        const parser = new DOMParser()
        const doc = parser.parseFromString(musicxml, 'text/xml')
        
        const notes: ParsedNote[] = []
        const noteElements = doc.querySelectorAll('note')
        
        let beatCount = 0
        noteElements.forEach((noteEl) => {
          const pitchEl = noteEl.querySelector('pitch')
          if (!pitchEl) return
          
          const step = pitchEl.querySelector('step')?.textContent || 'C'
          const octave = parseInt(pitchEl.querySelector('octave')?.textContent || '4')
          const alter = pitchEl.querySelector('alter')?.textContent
          
          let accidental = ''
          if (alter === '1') accidental = '#'
          else if (alter === '-1') accidental = 'b'
          
          const durationEl = noteEl.querySelector('duration')
          let duration = durationEl?.textContent || '4'
          
          const typeEl = noteEl.querySelector('type')
          const type = typeEl?.textContent || 'quarter'
          
          const durationMap: Record<string, string> = {
            '1': 'w',
            '2': 'h',
            '4': 'q',
            '8': '8',
            '16': '16',
            '32': '32'
          }
          
          const keys = `${step.toLowerCase()}/${octave}${accidental}`
          
          notes.push({
            keys,
            duration: durationMap[duration] || 'q',
            type
          })
          
          beatCount++
        })
        
        if (notes.length === 0) {
          setError('No se encontraron notas en la partitura')
          setIsLoading(false)
          return
        }
        
        const renderer = new Renderer(containerRef.current, Renderer.Backends.SVG)
        renderer.resize(800, 200)
        
        const context = renderer.getContext()
        context.setFont('Arial', 10)
        
        const stave = new Stave(10, 40, 780)
        stave.addClef('treble').addTimeSignature('4/4')
        stave.setContext(context).draw()
        
        const staveNotes = notes.slice(0, 16).map((noteData, index) => {
          const note = new StaveNote({
            keys: [noteData.keys],
            duration: noteData.duration,
            type: noteData.type as any
          })
          
          if (noteData.keys.includes('#')) {
            note.addModifier(new Accidental('#'))
          } else if (noteData.keys.includes('b')) {
            note.addModifier(new Accidental('b'))
          }
          
          return note
        })
        
        if (staveNotes.length > 0) {
          const voice = new Voice({ num_beats: 16, beat_value: 4 }).setMode(Voice.Mode.SOFT)
          voice.addTickables(staveNotes)
          
          new Formatter().joinVoices([voice]).format([voice], 700)
          voice.draw(context, stave)
        }
        
        if (notes.length > 16) {
          const extraNotes = notes.slice(16, 32)
          
          const stave2 = new Stave(10, 120, 780)
          stave2.setContext(context).draw()
          
          const stave2Notes = extraNotes.map((noteData) => {
            const note = new StaveNote({
              keys: [noteData.keys],
              duration: noteData.duration,
              type: noteData.type as any
            })
            
            if (noteData.keys.includes('#')) {
              note.addModifier(new Accidental('#'))
            } else if (noteData.keys.includes('b')) {
              note.addModifier(new Accidental('b'))
            }
            
            return note
          })
          
          if (stave2Notes.length > 0) {
            const voice2 = new Voice({ num_beats: 16, beat_value: 4 }).setMode(Voice.Mode.SOFT)
            voice2.addTickables(stave2Notes)
            
            new Formatter().joinVoices([voice2]).format([voice2], 700)
            voice2.draw(context, stave2)
          }
        }
        
        setIsLoading(false)
      } catch (err) {
        console.error('Error rendering score:', err)
        setError('Error al renderizar la partitura')
        setIsLoading(false)
      }
    }
    
    renderScore()
  }, [musicxml])

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-white/95 backdrop-blur-md z-50 overflow-y-auto"
    >
      <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex items-center justify-between shadow-md">
        <div>
          <h1 className="font-display text-2xl text-slate-800">
            🎼 {title || 'Partitura'}
          </h1>
          <p className="text-slate-500 text-sm">Vista previa de la partitura</p>
        </div>
        <div className="flex gap-3">
          {onImport && (
            <button
              onClick={onImport}
              className="px-5 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              🎮 Jugar
            </button>
          )}
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-all"
          >
            ✕ Cerrar
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {isLoading && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="spinner mx-auto mb-4 border-t-purple-500" />
              <p className="text-slate-500">Cargando partitura...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
            <p className="text-red-600">{error}</p>
            <button 
              onClick={onClose}
              className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200"
            >
              Cerrar
            </button>
          </div>
        )}

        <div 
          ref={containerRef} 
          className="bg-white rounded-xl shadow-lg border border-slate-200 p-4 overflow-auto"
          style={{ minHeight: '300px' }}
        />

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-blue-700 text-sm">
            💡 <strong>Nota:</strong> Esta vista previa muestra la notación musical. 
            Haz clic en "Jugar" para tocar las notas en el juego.
          </p>
        </div>
      </div>
    </motion.div>
  )
}