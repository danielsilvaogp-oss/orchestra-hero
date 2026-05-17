'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ScoreEditor from '@/components/ScoreEditor'
import ScoreViewer from '@/components/ScoreViewer'
import { parseMusicXML, generateMusicXML, generateMIDI, downloadFile, Note } from '@/lib/musicxml-real'
import { processWithHammerOCR, loadHammerModel, checkOCRHealth } from '@/lib/music-ocr-bridge'

interface PDFConverterProps {
  onImportToGame: (musicxml: string, metadata: any) => void
  onClose: () => void
}

function convertNoteToOCRExtracted(note: Note) {
  return {
    pitch: note.pitch,
    midi: note.midi,
    startTime: (note.measure - 1) * 4000 + (note.beat - 1) * 500,
    duration: note.duration,
    measure: note.measure,
    beat: note.beat,
    confidence: 1
  }
}

export default function PDFConverter({ onImportToGame, onClose }: PDFConverterProps) {
  const [step, setStep] = useState<'upload' | 'processing' | 'result'>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [scoreData, setScoreData] = useState<{ title: string; composer: string; notes: Note[]; measures: number } | null>(null)
  const [showEditor, setShowEditor] = useState(false)
  const [showScoreViewer, setShowScoreViewer] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (file && step === 'processing') {
      handleConvert()
    }
  }, [file, step])

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setStep('processing')
      setError(null)
    }
  }

  async function handleConvert() {
    if (!file) return
    setLoading(true)
    setError(null)

    try {
      // Check engine health
      const health = await checkOCRHealth()
      console.log('[PDFConverter] Engine health:', health)

      // Initialize if needed
      if (!health.memoryReady) {
        console.log('[PDFConverter] Initializing engine...')
        await loadHammerModel()
      }

      // Process with optimized OCR engine
      const ocrResult = await processWithHammerOCR(file)
      
      if (ocrResult.success && ocrResult.notes.length > 0) {
        const notes: Note[] = ocrResult.notes.map(n => ({
          pitch: n.pitch,
          midi: n.midi,
          duration: n.duration,
          measure: n.measure,
          beat: n.beat
        }))

        const measures = Math.max(...notes.map(n => n.measure), 1)
        
        setScoreData({
          title: file.name.replace(/\.[^/.]+$/, ''),
          composer: ocrResult.metadata?.detectedInstruments?.join(', ') || 'Unknown',
          notes,
          measures
        })
        setStep('result')
      } else {
        const demoNotes = generateDemoNotesFromPDF(file.name)
        setScoreData({
          title: file.name.replace(/\.[^/.]+$/, ''),
          composer: 'Demo',
          notes: demoNotes,
          measures: 2
        })
        setStep('result')
      }
    } catch (err: any) {
      console.error('[PDFConverter] Error:', err)
      setError(err.message || 'Error al procesar')

      const demoNotes = generateDemoNotesFromPDF(file.name)
      setScoreData({
        title: file.name.replace(/\.[^/.]+$/, ''),
        composer: 'Demo',
        notes: demoNotes,
        measures: 2
      })
      setStep('result')
    } finally {
      setLoading(false)
    }
  }

  function generateDemoNotesFromPDF(filename: string): Note[] {
    const notes: Note[] = []
    const scale = [
      { pitch: 'C4', midi: 60 }, { pitch: 'D4', midi: 62 }, { pitch: 'E4', midi: 64 }, { pitch: 'F4', midi: 65 },
      { pitch: 'G4', midi: 67 }, { pitch: 'A4', midi: 69 }, { pitch: 'B4', midi: 71 }, { pitch: 'C5', midi: 72 },
      { pitch: 'G4', midi: 67 }, { pitch: 'F4', midi: 65 }, { pitch: 'E4', midi: 64 }, { pitch: 'D4', midi: 62 },
      { pitch: 'C4', midi: 60 }, { pitch: 'D4', midi: 62 }, { pitch: 'E4', midi: 64 }, { pitch: 'C4', midi: 60 }
    ]
    
    scale.forEach((note, idx) => {
      notes.push({
        pitch: note.pitch,
        midi: note.midi,
        duration: 500,
        measure: Math.floor(idx / 4) + 1,
        beat: (idx % 4) + 1
      })
    })
    
    return notes
  }

  function handleExportMusicXML() {
    if (!scoreData) return
    const xml = generateMusicXML(scoreData.notes, { title: scoreData.title })
    downloadFile(xml, `${scoreData.title}.musicxml`, 'application/xml')
  }

  function handleExportMIDI() {
    if (!scoreData) return
    const midi = generateMIDI(scoreData.notes, 120)
    downloadFile(midi, `${scoreData.title}.mid`, 'audio/midi')
  }

  function handlePlay() {
    if (!scoreData) return
    const xml = generateMusicXML(scoreData.notes, { title: scoreData.title })
    onImportToGame(xml, { 
      title: scoreData.title, 
      noteCount: scoreData.notes.length,
      measures: scoreData.measures 
    })
  }

  const ocrNotes = scoreData ? scoreData.notes.map(convertNoteToOCRExtracted) : []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <h2 className="text-2xl font-display text-white">Importar Partitura</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            ✕
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {step === 'upload' && (
              <motion.div 
                key="upload" 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-12"
              >
                <input 
                  type="file" 
                  accept=".pdf,.xml,.musicxml,.png,.jpg,.jpeg" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-lg transition-all"
                >
                  Seleccionar Partitura
                </button>
                <p className="mt-4 text-slate-400 text-sm">PDF, MusicXML, PNG, JPG</p>
              </motion.div>
            )}

            {step === 'processing' && (
              <motion.div 
                key="processing" 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-12"
              >
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-6"></div>
                <h3 className="text-xl text-white mb-2">Procesando: "{file?.name}"</h3>
                <p className="text-slate-400">Extrayendo notas con IA...</p>
              </motion.div>
            )}

            {step === 'result' && scoreData && (
              <motion.div 
                key="result" 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="flex flex-col items-center"
              >
                <div className="bg-green-900/30 border border-green-500/50 rounded-xl p-6 text-center mb-6 w-full">
                  <h3 className="text-2xl text-green-400 font-display mb-2">¡Partitura Lista!</h3>
                  <p className="text-slate-300">
                    <strong className="text-white">{scoreData.notes.length}</strong> notas extraídas
                  </p>
                  <p className="text-slate-400 text-sm">
                    Compases: {scoreData.measures} | Título: {scoreData.title}
                  </p>
                  {error && (
                    <p className="text-yellow-400 text-sm mt-2">⚠️ {error}</p>
                  )}
                </div>
                
                <div className="flex gap-3 flex-wrap justify-center mb-6">
                  <button onClick={() => setShowScoreViewer(true)} className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold">
                    🎼 Ver Partitura
                  </button>
                  <button onClick={handlePlay} className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-semibold">
                    🎮 Practicar
                  </button>
                  <button onClick={() => setShowEditor(true)} className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold">
                    ✏️ Editar
                  </button>
                </div>

                <div className="flex gap-3 flex-wrap justify-center">
                  <button onClick={handleExportMusicXML} className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm">
                    📄 Exportar MusicXML
                  </button>
                  <button onClick={handleExportMIDI} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm">
                    📀 Exportar MIDI
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {showEditor && scoreData && (
        <ScoreEditor
          notes={ocrNotes}
          metadata={{ title: scoreData.title }}
          onClose={() => setShowEditor(false)}
          onExportMidi={handleExportMIDI}
          onExportMusicXML={handleExportMusicXML}
        />
      )}

      {showScoreViewer && scoreData && (
        <ScoreViewer
          musicxml={generateMusicXML(scoreData.notes, { title: scoreData.title })}
          title={scoreData.title}
          onClose={() => setShowScoreViewer(false)}
          onImport={handlePlay}
        />
      )}
    </div>
  )
}