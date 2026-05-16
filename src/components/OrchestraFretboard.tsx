'use client'

import { useRef } from 'react'
import { motion } from 'framer-motion'
import { InstrumentType, InstrumentFamily, OrchestralNote, isStringInstrument, isBrassInstrument, isWoodwindInstrument } from '@/lib/orchestral-note'

interface OrchestraFretboardProps {
  instrument: InstrumentType
  activeNotes: OrchestralNote[]
  hitZoneY: number
  onNoteHit?: (noteId: string) => void
}

// ============================================================
// WIDGET PRINCIPAL: Selector dinámico de renderizado
// ============================================================

export default function OrchestraFretboard({ 
  instrument, 
  activeNotes, 
  hitZoneY,
  onNoteHit 
}: OrchestraFretboardProps) {
  const family = getInstrumentFamilyByType(instrument)
  
  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Background según familia */}
      <FretboardBackground family={family} />
      
      {/* Renderizado específico por familia */}
      {family === InstrumentFamily.strings && (
        <StringFretboardView 
          notes={activeNotes} 
          hitZoneY={hitZoneY}
          instrument={instrument}
        />
      )}
      
      {family === InstrumentFamily.brass && (
        <BrassValveView 
          notes={activeNotes} 
          hitZoneY={hitZoneY}
        />
      )}
      
      {family === InstrumentFamily.woodwind && (
        <WoodwindKeyView 
          notes={activeNotes} 
          hitZoneY={hitZoneY}
        />
      )}
      
      {(family === InstrumentFamily.percussion || family === InstrumentFamily.keyboard) && (
        <SimpleLaneView 
          notes={activeNotes} 
          hitZoneY={hitZoneY}
        />
      )}
    </div>
  )
}

// ============================================================
// VISTAS ESPECÍFICAS POR INSTRUMENTO
// ============================================================

// --- VISTA DE CUERDAS (Fretboard con 4 cuerdas) ---
function StringFretboardView({ 
  notes, 
  hitZoneY,
  instrument 
}: { 
  notes: OrchestralNote[], 
  hitZoneY: number,
  instrument: InstrumentType
}) {
  const stringNames = getStringNames(instrument)
  
  return (
    <div className="relative w-full h-full flex">
      {/* Cuerdas verticales */}
      <div className="flex-1 relative">
        {stringNames.map((name, index) => (
          <div 
            key={index}
            className="absolute w-full"
            style={{
              left: `${15 + index * 20}%`,
              height: '100%',
              background: `linear-gradient(to right, 
                rgba(200,200,200,0.4) 0%, 
                rgba(255,255,255,0.6) 50%, 
                rgba(200,200,200,0.4) 100%)`,
              boxShadow: '0 0 4px rgba(255,255,255,0.3)'
            }}
          >
            {/* Nombre de cuerda */}
            <div 
              className="absolute -left-8 top-1/2 -translate-y-1/2 text-xs font-bold"
              style={{ color: getStringColor(index) }}
            >
              {name}
            </div>
          </div>
        ))}
        
        {/* Marcas del mástil (dots de posición) */}
        <div className="absolute inset-0 pointer-events-none">
          {[3, 5, 7, 9, 12].map(pos => (
            <div 
              key={pos}
              className="absolute w-3 h-3 rounded-full bg-white/20"
              style={{ 
                left: `${10 + pos * 2}%`, 
                top: '50%' 
              }}
            />
          ))}
        </div>
      </div>
      
      {/* Notas cayendo */}
      {notes.map(note => {
        const meta = note.metadata as any
        const yPosition = calculateNoteY(note.startTime, hitZoneY)
        const xPosition = ((meta.stringNumber - 1) * 20) + 15
        
        return (
          <FretboardNote
            key={note.id}
            x={xPosition}
            y={yPosition}
            label={meta.finger === 'open' ? '○' : meta.finger?.toString() || ''}
            color={getStringColor(meta.stringNumber - 1)}
          />
        )
      })}
    </div>
  )
}

// --- VISTA DE VIENTOS METAL (Pistones) ---
function BrassValveView({ 
  notes, 
  hitZoneY 
}: { 
  notes: OrchestralNote[], 
  hitZoneY: number
}) {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center gap-8">
      {/* Visualización de pistones */}
      <div className="flex gap-4">
        {[1, 2, 3].map(valveNum => (
          <div key={valveNum} className="flex flex-col items-center">
            {/* Botón del pistón */}
            <div className="w-16 h-20 rounded-xl bg-gradient-to-b from-gray-400 to-gray-600 border-4 border-gray-500 shadow-lg">
              <div className="w-full h-4 bg-gray-700 rounded-t-lg" />
            </div>
            <span className="mt-2 text-white/60 font-bold">{valveNum}</span>
          </div>
        ))}
      </div>
      
      {/* Leyenda de combinaciones */}
      <div className="bg-black/30 rounded-xl p-4 text-sm text-white/70">
        <p>1 = 1º pistón | 2 = 2º pistón | 3 = 3º pistón</p>
        <p>Ej: 1+2 = pistones 1 y 2 juntos</p>
      </div>
      
      {/* Notas */}
      {notes.map(note => {
        const meta = note.metadata as any
        const yPosition = calculateNoteY(note.startTime, hitZoneY)
        
        return (
          <div
            key={note.id}
            className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2"
            style={{ top: `${yPosition}px` }}
          >
            <NoteBubble 
              label={meta.valveCombination || '—'} 
              color="#ff8c00"
            />
          </div>
        )
      })}
    </div>
  )
}

// --- VISTA DE VIENTOS MADERA (Llaves) ---
function WoodwindKeyView({ 
  notes, 
  hitZoneY 
}: { 
  notes: OrchestralNote[], 
  hitZoneY: number
}) {
  const keys = ['1', '2', '3', '4', '5', '6', 'R']
  
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center gap-8">
      {/* Visualización de llaves */}
      <div className="flex flex-wrap justify-center gap-3 max-w-md">
        {keys.map((key, index) => (
          <div 
            key={key}
            className={`
              w-10 h-10 rounded-full border-4 flex items-center justify-center font-bold
              ${index < 6 
                ? 'bg-gradient-to-b from-cyan-400 to-cyan-600 border-cyan-500' 
                : 'bg-gradient-to-b from-amber-400 to-amber-600 border-amber-500'
              }
            `}
          >
            <span className="text-white text-sm">{key}</span>
          </div>
        ))}
      </div>
      
      {/* Indicador de dedos */}
      <div className="bg-black/30 rounded-xl p-4 text-sm text-white/70">
        <p>Presiona las teclas correspondiendo a los números</p>
      </div>
      
      {/* Notas */}
      {notes.map(note => {
        const meta = note.metadata as any
        const yPosition = calculateNoteY(note.startTime, hitZoneY)
        
        return (
          <div
            key={note.id}
            className="absolute left-1/2 -translate-x-1/2"
            style={{ top: `${yPosition}px` }}
          >
            <NoteBubble 
              label={meta.keyCombination || 'open'} 
              color="#87ceeb"
            />
          </div>
        )
      })}
    </div>
  )
}

// --- VISTA SIMPLE (Percusión/Teclado) ---
function SimpleLaneView({ 
  notes, 
  hitZoneY 
}: { 
  notes: OrchestralNote[], 
  hitZoneY: number
}) {
  return (
    <div className="relative w-full h-full">
      {/* 4 lanes simples */}
      <div className="absolute inset-0 flex">
        {['A', 'S', 'D', 'F'].map((key, index) => (
          <div 
            key={key}
            className="flex-1 border-l border-r border-white/10 relative"
          >
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/30 font-bold text-2xl">
              {key}
            </div>
          </div>
        ))}
      </div>
      
      {/* Notas */}
      {notes.map((note, index) => {
        const yPosition = calculateNoteY(note.startTime, hitZoneY)
        
        return (
          <div
            key={note.id}
            className="absolute"
            style={{ 
              top: `${yPosition}px`, 
              left: `${15 + index * 20}%` 
            }}
          >
            <NoteBubble 
              label={note.pitch} 
              color="#9b30ff"
            />
          </div>
        )
      })}
    </div>
  )
}

// ============================================================
// COMPONENTES AUXILIARES
// ============================================================

function FretboardBackground({ family }: { family: InstrumentFamily }) {
  const bgClass = {
    [InstrumentFamily.strings]: 'bg-gradient-to-b from-amber-900 via-amber-800 to-amber-900',
    [InstrumentFamily.brass]: 'bg-gradient-to-b from-orange-900 via-orange-800 to-orange-900',
    [InstrumentFamily.woodwind]: 'bg-gradient-to-b from-cyan-900 via-cyan-800 to-cyan-900',
    [InstrumentFamily.percussion]: 'bg-gradient-to-b from-gray-800 to-gray-900',
    [InstrumentFamily.keyboard]: 'bg-gradient-to-b from-slate-800 to-slate-900',
  }[family] || 'bg-slate-900'
  
  return (
    <div className={`absolute inset-0 ${bgClass}`}>
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(white 1px, transparent 1px),
            linear-gradient(90deg, white 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}
      />
    </div>
  )
}

function FretboardNote({ 
  x, 
  y, 
  label,
  color 
}: { 
  x: number, 
  y: number,
  label: string,
  color: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="absolute transform -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${x}%`, top: y }}
    >
      <div 
        className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg border-2"
        style={{ 
          backgroundColor: color,
          boxShadow: `0 0 20px ${color}80`
        }}
      >
        <span className="text-white font-bold text-sm">{label}</span>
      </div>
    </motion.div>
  )
}

function NoteBubble({ label, color }: { label: string, color: string }) {
  return (
    <div 
      className="px-4 py-2 rounded-full font-bold text-white shadow-lg"
      style={{ backgroundColor: color }}
    >
      {label}
    </div>
  )
}

// ============================================================
// HELPERS
// ============================================================

function calculateNoteY(noteStartTime: number, hitZoneY: number): number {
  return hitZoneY - (noteStartTime / 10)
}

function getInstrumentFamilyByType(type: InstrumentType): InstrumentFamily {
  const stringInstruments = ['violin', 'viola', 'cello', 'double_bass']
  const brassInstruments = ['trumpet', 'french_horn', 'trombone', 'tuba']
  const woodwindInstruments = ['flute', 'clarinet', 'oboe', 'bassoon']
  const percussionInstruments = ['timpani', 'snare_drum', 'drum_set']
  
  if (stringInstruments.includes(type)) return InstrumentFamily.strings
  if (brassInstruments.includes(type)) return InstrumentFamily.brass
  if (woodwindInstruments.includes(type)) return InstrumentFamily.woodwind
  if (percussionInstruments.includes(type)) return InstrumentFamily.percussion
  return InstrumentFamily.keyboard
}

function getStringNames(instrument: InstrumentType): string[] {
  const map: Record<string, string[]> = {
    violin: ['E', 'A', 'D', 'G'],
    viola: ['A', 'D', 'G', 'C'],
    cello: ['A', 'D', 'G', 'C'],
    double_bass: ['G', 'D', 'A', 'E'],
  }
  return map[instrument] || ['E', 'A', 'D', 'G']
}

function getStringColor(index: number): string {
  const colors = ['#9b30ff', '#cc6633', '#8b4513', '#4a3728']
  return colors[index] || '#ffffff'
}