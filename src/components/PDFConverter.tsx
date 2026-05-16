'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { convertPDFToMusicXML, musicXMLToMidi, SAMPLE_SONGS, ConvertResult } from '@/lib/pdf-music-converter'
import ScoreEditor from '@/components/ScoreEditor'
import { OCRExtractedNote } from '@/lib/music-ocr-bridge'
import { ParsedNote } from '@/lib/musicxml-parser'

interface PDFConverterProps {
  onImportToGame: (musicxml: string, metadata: any) => void
  onClose: () => void
}

export default function PDFConverter({ onImportToGame, onClose }: PDFConverterProps) {
  const [step, setStep] = useState<'upload' | 'convert' | 'result'>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ConvertResult | null>(null)
  const [selectedSong, setSelectedSong] = useState<string | null>(null)
  const [showLibrary, setShowLibrary] = useState(false)
  const [showEditor, setShowEditor] = useState(false)
  const [parsedNotes, setParsedNotes] = useState<OCRExtractedNote[]>([])
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && (selectedFile.name.endsWith('.pdf') || selectedFile.name.endsWith('.xml') || selectedFile.name.endsWith('.musicxml'))) {
      setFile(selectedFile)
    } else {
      alert('Por favor selecciona un archivo PDF o MusicXML')
    }
  }

  async function handleConvert() {
    if (!file) return
    
    setLoading(true)
    setStep('convert')
    
    try {
      let convertResult: ConvertResult
      
      if (file.name.endsWith('.xml') || file.name.endsWith('.musicxml')) {
        // Already MusicXML - just read it
        const text = await file.text()
        convertResult = {
          success: true,
          musicxml: text,
          metadata: { title: file.name.replace(/\.(xml|musicxml)$/, '') }
        }
      } else {
        // Convert PDF
        const arrayBuffer = await file.arrayBuffer()
        convertResult = await convertPDFToMusicXML(arrayBuffer, {
          targetInstrument: 'violin',
          tempo: 120,
          includeDynamics: true
        })
      }
      
      setResult(convertResult)
      
      if (convertResult.success) {
        setStep('result')
      } else {
        setStep('upload')
      }
    } catch (error) {
      console.error('Conversion error:', error)
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      })
      setStep('upload')
    }
    
    setLoading(false)
  }

  function handleImport() {
    if (result?.musicxml) {
      onImportToGame(result.musicxml, result.metadata)
    }
  }

  function handleOpenEditor() {
    if (result?.musicxml) {
      // Parse the MusicXML to get notes for the editor
      parseMusicXMLForEditor(result.musicxml)
      setShowEditor(true)
    }
  }

  async function parseMusicXMLForEditor(musicxml: string) {
    try {
      const parser = new DOMParser()
      const doc = parser.parseFromString(musicxml, 'text/xml')
      const notes: OCRExtractedNote[] = []
      
      const noteElements = doc.querySelectorAll('note')
      let currentTime = 0
      
      noteElements.forEach((noteEl) => {
        const pitchEl = noteEl.querySelector('pitch')
        if (!pitchEl) return
        
        const step = pitchEl.querySelector('step')?.textContent || 'C'
        const octave = parseInt(pitchEl.querySelector('octave')?.textContent || '4')
        const duration = parseInt(noteEl.querySelector('duration')?.textContent || '1') * 250
        
        const noteToMidi: Record<string, number> = {
          'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5,
          'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11
        }
        const midi = (octave + 1) * 12 + (noteToMidi[step] || 0)
        
        const measureNum = noteEl.closest('measure')?.getAttribute('number')
        
        notes.push({
          pitch: `${step}${octave}`,
          midi,
          startTime: currentTime,
          duration,
          measure: parseInt(measureNum || '1'),
          beat: 1,
          confidence: 1.0
        })
        
        currentTime += duration + 100
      })
      
      setParsedNotes(notes)
    } catch (e) {
      console.error('Failed to parse MusicXML:', e)
      setParsedNotes([])
    }
  }

  function handleExportMidi(notes: OCRExtractedNote[]) {
    const midi = generateSimpleMidi(notes)
    const blob = new Blob([midi] as BlobPart[], { type: 'audio/midi' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${result?.metadata?.title || 'score'}.mid`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleExportMusicXML(notes: OCRExtractedNote[]) {
    const xml = generateMusicXML(notes, 120, 'violin')
    const blob = new Blob([xml], { type: 'application/xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${result?.metadata?.title || 'score'}.xml`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImportToGameFromEditor(notes: OCRExtractedNote[]) {
    const xml = generateMusicXML(notes, result?.metadata?.tempo || 120, 'violin')
    onImportToGame(xml, { ...result?.metadata, noteCount: notes.length })
    setShowEditor(false)
  }

  function generateMusicXML(notes: OCRExtractedNote[], tempo: number, instrument: string): string {
    const ns = 'http://www.musicxml.org/schema/MusicXML'
    const beatDuration = 60000 / tempo

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1" xmlns="${ns}">
  <work><work-title>Partitura Editada</work-title></work>
  <defaults><sound tempo="${tempo}"/></defaults>
  <part-list><score-part id="P1"><part-name>${instrument}</part-name></score-part></part-list>
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
        xml += `\n      <note><pitch><step>${step}</step><octave>${octave}</octave></pitch><duration>${duration}</duration><type>quarter</type></note>`
      })
      xml += '\n    </measure>'
    })

    xml += '\n  </part>\n</score-partwise>'
    return xml
  }

  function generateSimpleMidi(notes: OCRExtractedNote[]): Uint8Array {
    const PPQ = 480
    const tempo = result?.metadata?.tempo || 120
    const microsecondsPerBeat = 60000000 / tempo
    
    const sortedNotes = [...notes].sort((a, b) => a.startTime - b.startTime)
    const events: number[] = []
    
    sortedNotes.forEach(note => {
      const startTicks = Math.round((note.startTime / 1000) * (microsecondsPerBeat / 1000) * PPQ / 60000)
      const durationTicks = Math.round((note.duration / 1000) * (microsecondsPerBeat / 1000) * PPQ / 60000)
      
      events.push(0x90, note.midi, 0x40) // Note on
      events.push(...varLength(startTicks), ...varLength(durationTicks), 0x80, note.midi, 0x00)
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

  function handleImportSample(songId: string) {
    const song = SAMPLE_SONGS.find(s => s.id === songId)
    if (song) {
      // For demo, we'll generate a simple MusicXML based on the song
      // In production, these would be pre-converted files
      const simpleMusicXML = generateSimpleMusicXML(song.title, song.composer, song.tempo)
      onImportToGame(simpleMusicXML, {
        title: song.title,
        composer: song.composer,
        tempo: song.tempo,
        difficulty: song.difficulty
      })
    }
  }

  return (
    <div className="fixed inset-0 bg-orchestra-dark z-50 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-orchestra-dark-secondary border-b border-white/10 p-4 flex items-center justify-between">
        <h1 className="font-display text-2xl text-orchestra-gold">
          📄 Importar Partituras
        </h1>
        <button onClick={onClose} className="text-white/60 hover:text-white">
          ✕ Cerrar
        </button>
      </div>

      <div className="max-w-2xl mx-auto p-6">
        {/* Method Selection */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setShowLibrary(false)}
            className={`flex-1 p-4 rounded-xl border-2 transition-all ${
              !showLibrary 
                ? 'border-orchestra-gold bg-orchestra-gold/10' 
                : 'border-white/20 hover:border-white/40'
            }`}
          >
            <div className="text-2xl mb-2">📄</div>
            <div className="font-medium">Subir Archivo</div>
            <div className="text-white/40 text-sm">PDF o MusicXML</div>
          </button>
          
          <button
            onClick={() => setShowLibrary(true)}
            className={`flex-1 p-4 rounded-xl border-2 transition-all ${
              showLibrary 
                ? 'border-orchestra-gold bg-orchestra-gold/10' 
                : 'border-white/20 hover:border-white/40'
            }`}
          >
            <div className="text-2xl mb-2">🎵</div>
            <div className="font-medium">Biblioteca</div>
            <div className="text-white/40 text-sm">Canciones de ejemplo</div>
          </button>
        </div>

        {!showLibrary ? (
          // Upload Section
          <>
            {step === 'upload' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass rounded-xl p-6"
              >
                <h2 className="font-display text-xl text-white mb-4">Subir archivo de partitura</h2>
                
                {/* Drop zone */}
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center mb-4 cursor-pointer transition-all ${
                    file 
                      ? 'border-green-500 bg-green-500/10' 
                      : 'border-white/20 hover:border-white/40'
                  }`}
                >
                  <input 
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.xml,.musicxml"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  
                  {file ? (
                    <div className="text-green-400">
                      <div className="text-4xl mb-2">✓</div>
                      <div>{file.name}</div>
                      <div className="text-sm text-white/50">{(file.size / 1024).toFixed(1)} KB</div>
                    </div>
                  ) : (
                    <div className="text-white/40">
                      <div className="text-4xl mb-2">📄</div>
                      <div>Arrastra tu archivo aquí</div>
                      <div className="text-sm">PDF, XML, o MusicXML</div>
                    </div>
                  )}
                </div>
                
                {/* Info */}
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4">
                  <p className="text-blue-300 text-sm">
                    💡 Los archivos PDF serán convertidos automáticamente. 
                    Para mejores resultados, usa archivos MusicXML (Exportar desde Finale, Sibelius, MuseScore)
                  </p>
                </div>
                
                <button
                  onClick={handleConvert}
                  disabled={!file}
                  className={`btn-gold w-full ${!file ? 'opacity-50' : ''}`}
                >
                  Convertir e Importar
                </button>
              </motion.div>
            )}

            {step === 'convert' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass rounded-xl p-8 text-center"
              >
                <div className="spinner mx-auto mb-4" />
                <h2 className="font-display text-xl text-white mb-2">
                  Convirtiendo partitura...
                </h2>
                <p className="text-white/40">
                  Este proceso puede tomar unos segundos
                </p>
              </motion.div>
            )}

            {step === 'result' && result?.success && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass rounded-xl p-6"
              >
                <div className="text-center mb-6">
                  <div className="text-5xl mb-2">✅</div>
                  <h2 className="font-display text-2xl text-green-400">
                    ¡Conversión exitosa!
                  </h2>
                </div>
                
                {result.metadata && (
                  <div className="bg-white/5 rounded-lg p-4 mb-4">
                    <div className="text-white/60 text-sm mb-2">Información detectada:</div>
                    <div className="text-white">
                      {result.metadata.title && <p>Título: {result.metadata.title}</p>}
                      {result.metadata.noteCount && <p>Notas: {result.metadata.noteCount}</p>}
                    </div>
                  </div>
                )}
                
                {result.warnings && result.warnings.length > 0 && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4">
                    {result.warnings.map((w, i) => (
                      <p key={i} className="text-yellow-300 text-sm">⚠️ {w}</p>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <button
                    onClick={handleOpenEditor}
                    className="py-3 bg-purple-600/20 border border-purple-500 text-purple-400 rounded-lg font-semibold hover:bg-purple-600/30"
                  >
                    ✏️ Editar Partitura
                  </button>
                  <button
                    onClick={handleImport}
                    className="py-3 bg-green-600/20 border border-green-500 text-green-400 rounded-lg font-semibold hover:bg-green-600/30"
                  >
                    🎮 Jugar Directo
                  </button>
                </div>

                <p className="text-white/40 text-sm text-center">
                  Edita la partitura para corregir errores antes de jugar
                </p>
              </motion.div>
            )}

            {step === 'result' && !result?.success && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass rounded-xl p-6"
              >
                <div className="text-center mb-6">
                  <div className="text-5xl mb-2">❌</div>
                  <h2 className="font-display text-2xl text-red-400">
                    Error en la conversión
                  </h2>
                  <p className="text-white/60 mt-2">{result?.error}</p>
                </div>
                
                <button
                  onClick={() => setStep('upload')}
                  className="btn-outline w-full"
                >
                  Intentar de nuevo
                </button>
              </motion.div>
            )}
          </>
        ) : (
          // Sample Songs Library
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass rounded-xl p-6"
          >
            <h2 className="font-display text-xl text-white mb-4">🎵 Biblioteca de Canciones</h2>
            
            <div className="space-y-3">
              {SAMPLE_SONGS.map((song) => (
                <motion.button
                  key={song.id}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => handleImportSample(song.id)}
                  className="w-full p-4 rounded-xl text-left transition-all bg-white/5 hover:bg-white/10 border border-white/10 hover:border-orchestra-gold/30"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white font-medium">{song.title}</div>
                      <div className="text-white/40 text-sm">{song.composer}</div>
                    </div>
                    <div className="text-right">
                      <span className={`difficulty-badge difficulty-${song.difficulty}`}>
                        {song.difficulty}
                      </span>
                      <div className="text-white/30 text-xs mt-1">♫ {song.tempo} BPM</div>
                    </div>
                  </div>
                  <div className="text-white/40 text-xs mt-2">{song.description}</div>
                </motion.button>
              ))}
            </div>
            
            <p className="text-white/30 text-xs text-center mt-4">
              Más canciones disponibles en el panel de administración
            </p>
          </motion.div>
        )}
      </div>

      {showEditor && parsedNotes.length > 0 && (
        <ScoreEditor
          notes={parsedNotes}
          metadata={result?.metadata}
          onExportMidi={handleExportMidi}
          onExportMusicXML={handleExportMusicXML}
          onImportToGame={handleImportToGameFromEditor}
          onClose={() => setShowEditor(false)}
        />
      )}
    </div>
  )
}

// Helper function to generate simple MusicXML for demo
function generateSimpleMusicXML(title: string, composer: string, tempo: number): string {
  const ns = 'http://www.musicxml.org/schema/MusicXML'
  
  // Generate a simple C major scale as demo
  const notes = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C']
  const octave = 4
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1" xmlns="${ns}">
  <work><work-title>${title}</work-title></work>
  <identification><creator type="composer">${composer}</creator></identification>
  <defaults><sound tempo="${tempo}"/></defaults>
  <part-list><score-part id="P1"><part-name>Violin</part-name></score-part></part-list>
  <part id="P1">`
  
  notes.forEach((note, i) => {
    const nextOctave = note === 'C' && i > 0 ? octave + 1 : octave
    xml += `
    <measure number="${i+1}">
      <note>
        <pitch><step>${note}</step><octave>${nextOctave}</octave></pitch>
        <duration>4</duration>
        <type>quarter</type>
      </note>
    </measure>`
  })
  
  xml += '\n  </part>\n</score-partwise>'
  
  return xml
}