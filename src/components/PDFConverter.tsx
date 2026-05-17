'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ScoreEditor from '@/components/ScoreEditor'
import ScoreViewer from '@/components/ScoreViewer'
// IMPORTACIÓN CORREGIDA: Traemos la instancia por defecto
import hammerOCR, { OCRExtractedNote } from '@/lib/music-ocr-bridge'

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
      // LÓGICA CORREGIDA: 
      // .processImage() ya se encarga de llamar internamente a loadModel('v2')
      const ocrResult = await hammerOCR.processImage(file);

      if (ocrResult.success && ocrResult.notes.length > 0) {
        setParsedNotes(ocrResult.notes);
        setResult({
          notes: ocrResult.notes,
          metadata: ocrResult.metadata
        });
        setStep('result');
      } else {
        alert("La IA no detectó notas válidas. Asegúrate de que la partitura sea legible.");
      }
    } catch (error) {
      console.error('Error procesando:', error)
      alert("Hubo un error al ejecutar la IA visual de Hammer Academy.");
    } finally {
      setLoading(false)
    }
  }

  function handleImport() {
    if (result && parsedNotes.length > 0) {
      // Aquí podrías generar el XML real basado en parsedNotes si tienes la lógica
      onImportToGame("<xml>MusicXML Generado por Hammer V2</xml>", result.metadata)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <h2 className="text-2xl font-display text-white">Importar Partitura (Hammer V2 PRO)</h2>
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
                  className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-lg transition-all"
                >
                  Seleccionar Partitura
                </button>
                <p className="mt-4 text-slate-400 text-sm">PDF, PNG o JPG soportados</p>
              </motion.div>
            )}

            {step === 'convert' && (
              <motion.div key="convert" className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-6"></div>
                <h3 className="text-xl text-white mb-6">Archivo listo: "{file?.name}"</h3>
                <button 
                  onClick={handleConvert}
                  disabled={loading}
                  className={`px-8 py-4 rounded-xl font-bold text-lg transition-all ${loading ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-500 text-white'}`}
                >
                  {loading ? 'Analizando con Hammer AI...' : 'Iniciar Escaneo Inteligente'}
                </button>
              </motion.div>
            )}

            {step === 'result' && result && (
              <motion.div key="result" className="flex flex-col items-center justify-center py-12">
                <div className="bg-green-900/30 border border-green-500/50 rounded-xl p-6 text-center mb-8">
                  <h3 className="text-2xl text-green-400 font-display mb-2">¡Escaneo Exitoso!</h3>
                  <p className="text-slate-300">
                    Se detectaron <strong className="text-white">{parsedNotes.length}</strong> notas para <span className="text-blue-400">{result.metadata?.detectedInstruments?.[0] || 'instrumento'}</span>.
                  </p>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => setShowEditor(true)} className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors">
                    Revisar y Editar
                  </button>
                  <button onClick={handleImport} className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors">
                    Llevar a la Práctica
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
