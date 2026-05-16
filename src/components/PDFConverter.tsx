// PDFConverter.tsx
'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ScoreEditor from '@/components/ScoreEditor'
import ScoreViewer from '@/components/ScoreViewer'
import { OCRExtractedNote, processWithHammerOCR, loadHammerModel } from '@/lib/music-ocr-bridge'

interface ConvertResult {
  musicxml?: string;
  metadata?: any;
  notes?: OCRExtractedNote[];
}

interface PDFConverterProps {
  onImportToGame: (musicxml: string, metadata: any) => void
  onClose: () => void
}

export default function PDFConverter({ onImportToGame, onClose }: PDFConverterProps) {
  const [step, setStep] = useState<'upload' | 'convert' | 'result'>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ConvertResult | null>(null)
  const [showEditor, setShowEditor] = useState(false)
  const [showScoreViewer, setShowScoreViewer] = useState(false)
  const [parsedNotes, setParsedNotes] = useState<OCRExtractedNote[]>([])
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setStep('convert')
    }
  }

  async function handleConvert() {
    if (!file) return
    setLoading(true)

    try {
      // 1. Cargar el modelo V2 PRO
      await loadHammerModel('v2');
      
      // 2. Procesar visualmente con IA (Superando a Audiveris)
      const ocrResult = await processWithHammerOCR(file);

      if (ocrResult.success && ocrResult.notes.length > 0) {
        setParsedNotes(ocrResult.notes);
        setResult({
          notes: ocrResult.notes,
          metadata: ocrResult.metadata
        });
        setStep('result');
      } else {
        alert("La IA no detectó notas válidas. ¿Es una partitura clara?");
      }
    } catch (error) {
      console.error('Error procesando:', error)
      alert("Hubo un error al ejecutar la IA visual.");
    } finally {
      setLoading(false)
    }
  }

  function handleImport() {
    if (result && parsedNotes.length > 0) {
      onImportToGame("<xml>MusicXML Generado</xml>", result.metadata)
    }
  }

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
              <motion.div key="upload" className="flex flex-col items-center justify-center py-12">
                <input 
                  type="file" 
                  accept=".pdf,image/png,image/jpeg" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-lg"
                >
                  Seleccionar Archivo
                </button>
              </motion.div>
            )}

            {step === 'convert' && (
              <motion.div key="convert" className="flex flex-col items-center justify-center py-12">
                <h3 className="text-xl text-white mb-6">Analizando "{file?.name}"...</h3>
                <button 
                  onClick={handleConvert}
                  disabled={loading}
                  className={`px-8 py-4 rounded-xl font-bold text-lg ${loading ? 'bg-slate-700 text-slate-400' : 'bg-green-600 hover:bg-green-500 text-white'}`}
                >
                  {loading ? 'Ejecutando IA...' : 'Iniciar Escaneo V2'}
                </button>
              </motion.div>
            )}

            {step === 'result' && result && (
              <motion.div key="result" className="flex flex-col items-center justify-center py-12">
                <div className="bg-green-900/30 border border-green-500/50 rounded-xl p-6 text-center mb-8">
                  <h3 className="text-2xl text-green-400 font-display mb-2">¡Partitura Procesada!</h3>
                  <p className="text-slate-300">
                    La IA detectó <strong className="text-white">{parsedNotes.length}</strong> notas musicales válidas.
                  </p>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => setShowEditor(true)} className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg">
                    Revisar Notas
                  </button>
                  <button onClick={handleImport} className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg">
                    Llevar al Juego
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {showEditor && (
        <ScoreEditor
          notes={parsedNotes}
          metadata={result?.metadata}
          onClose={() => setShowEditor(false)}
        />
      )}
    </div>
  )
}
