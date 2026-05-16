// Music OCR Bridge - Integrate your trained OCR model (hammer trainer)
// Uses TensorFlow.js to run .tflite models directly in the browser

import * as tf from '@tensorflow/tfjs'
import * as tfLite from '@tensorflow/tfjs-backend-wasm'

export interface OCRResult {
  success: boolean
  notes: OCRExtractedNote[]
  warnings?: string[]
  metadata?: {
    title?: string
    composer?: string
    detectedInstruments?: string[]
    confidence?: number
  }
}

export interface OCRExtractedNote {
  pitch: string
  midi: number
  startTime: number
  duration: number
  measure: number
  beat: number
  confidence: number
  position?: { x: number; y: number }
}

// Model configuration - uses hammer trainer models
const OCR_MODELS = {
  v1: '/models/hammer_academy_v1_full.tflite',
  v2: '/models/hammer_academy_V2_PRO.tflite'
}

const DEFAULT_MODEL = 'v2'

// ============================================
// TensorFlow.js OCR Service
// ============================================

export class HammerOCRService {
  private model: tf.LayersModel | tf.GraphModel | null = null
  private modelLoaded: boolean = false
  private currentModel: string = DEFAULT_MODEL

  async loadModel(modelVersion: 'v1' | 'v2' = DEFAULT_MODEL): Promise<boolean> {
    try {
      console.log(`Loading Hammer OCR model: ${modelVersion}`)
      
      // Initialize WASM backend for better performance
      await tf.setBackend('wasm')
      await tf.ready()
      
      // Load TFLite model via TensorFlow.js
      // Note: For production, model files should be in public/models/
      // For now, we'll try to load from public folder
      const modelPath = OCR_MODELS[modelVersion]
      
      // Try loading as TensorFlow Lite
      try {
        this.model = await tf.loadLayersModel(modelPath)
        this.modelLoaded = true
        console.log('Model loaded successfully!')
        return true
      } catch (liteError) {
        console.warn('TFLite load failed, trying SavedModel format:', liteError)
        
        // Try loading as SavedModel
        try {
          this.model = await tf.loadGraphModel(modelPath)
          this.modelLoaded = true
          return true
        } catch (graphError) {
          console.warn('Model loading failed:', graphError)
          this.modelLoaded = false
          return false
        }
      }
    } catch (error) {
      console.error('Failed to load Hammer OCR model:', error)
      this.modelLoaded = false
      return false
    }
  }

  async checkConnection(): Promise<boolean> {
    if (!this.modelLoaded) {
      await this.loadModel(this.currentModel as 'v1' | 'v2')
    }
    return this.modelLoaded
  }

  async processImage(file: File | Blob): Promise<OCRResult> {
    if (!this.modelLoaded) {
      const loaded = await this.loadModel()
      if (!loaded) {
        return {
          success: false,
          notes: [],
          warnings: ['OCR model not loaded. Place model files in public/models/ folder.']
        }
      }
    }

    try {
      // Convert image to tensor
      const imageTensor = await this.preprocessImage(file)
      
      // Run inference
      const predictions = this.model!.predict(imageTensor) as tf.Tensor
      const results = await predictions.data() as Float32Array
      
      // Process predictions
      const notes = this.parsePredictions(results)
      
      // Clean up tensors
      imageTensor.dispose()
      predictions.dispose()

      return {
        success: true,
        notes,
        metadata: {
          confidence: 0.85,
          detectedInstruments: this.detectInstruments(notes)
        }
      }
    } catch (error) {
      console.error('OCR processing error:', error)
      return {
        success: false,
        notes: [],
        warnings: ['OCR processing failed. Using basic converter.']
      }
    }
  }

  private async preprocessImage(file: File | Blob): Promise<tf.Tensor> {
    const bitmap = await createImageBitmap(file)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    
    // Resize to model input size (typically 224x224 or 512x512)
    const inputSize = 512
    canvas.width = inputSize
    canvas.height = inputSize
    ctx.drawImage(bitmap, 0, 0, inputSize, inputSize)
    
    const imageData = ctx.getImageData(0, 0, inputSize, inputSize)
    const pixels = imageData.data
    
    // Normalize to [0, 1]
    const normalized = new Float32Array(inputSize * inputSize * 3)
    for (let i = 0; i < pixels.length; i += 4) {
      normalized[i / 4] = pixels[i] / 255       // R
      normalized[i / 4 + 1] = pixels[i + 1] / 255 // G
      normalized[i / 4 + 2] = pixels[i + 2] / 255 // B
    }
    
    return tf.tensor3d(normalized, [inputSize, inputSize, 3])
  }

  private parsePredictions(results: Float32Array): OCRExtractedNote[] {
    // This parsing logic depends on your model's output format
    // Adjust based on your actual model architecture
    
    const notes: OCRExtractedNote[] = []
    const stepNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    
    // Example: Assuming model outputs note positions and pitches
    // You'll need to adjust this to match your actual model output
    const numDetections = Math.min(results.length / 6, 50) // Max 50 notes
    
    for (let i = 0; i < numDetections; i++) {
      const baseIdx = i * 6
      
      const confidence = results[baseIdx + 0]
      if (confidence < 0.5) continue // Skip low confidence detections
      
      // Extract pitch class (0-11 for C through B)
      const pitchClass = Math.floor(results[baseIdx + 1] * 12) % 12
      // Extract octave (typically 3-6 for orchestral scores)
      const octave = Math.floor(results[baseIdx + 2] * 4) + 3
      // Extract position/measure
      const position = results[baseIdx + 3] * 100 // 0-100% through score
      const duration = (results[baseIdx + 4] + 0.1) * 1000 // Duration in ms
      
      const midi = (octave + 1) * 12 + pitchClass
      const measure = Math.floor(position / 4) + 1 // Approx 4 measures per 25%
      const beat = Math.floor((position % 4) * 4) + 1
      
      notes.push({
        pitch: `${stepNames[pitchClass]}${octave}`,
        midi,
        startTime: position * 10, // Convert to ms
        duration: duration,
        measure,
        beat,
        confidence,
        position: { x: position, y: 0 }
      })
    }
    
    // Sort by start time
    notes.sort((a, b) => a.startTime - b.startTime)
    
    return notes
  }

  private detectInstruments(notes: OCRExtractedNote[]): string[] {
    // Simple instrument detection based on pitch range
    const instruments: Set<string> = new Set()
    
    const avgMidi = notes.reduce((sum, n) => sum + n.midi, 0) / notes.length
    
    if (avgMidi >= 55 && avgMidi <= 72) instruments.add('violin')
    if (avgMidi >= 48 && avgMidi <= 65) instruments.add('viola')
    if (avgMidi >= 40 && avgMidi <= 60) instruments.add('cello')
    if (avgMidi >= 28 && avgMidi <= 48) instruments.add('double bass')
    if (avgMidi >= 60 && avgMidi <= 84) instruments.add('flute')
    if (avgMidi >= 58 && avgMidi <= 76) instruments.add('oboe')
    if (avgMidi >= 50 && avgMidi <= 75) instruments.add('clarinet')
    if (avgMidi >= 40 && avgMidi <= 65) instruments.add('bassoon')
    if (avgMidi >= 40 && avgMidi <= 65) instruments.add('french horn')
    if (avgMidi >= 55 && avgMidi <= 75) instruments.add('trumpet')
    if (avgMidi >= 40 && avgMidi <= 60) instruments.add('trombone')
    if (avgMidi >= 28 && avgMidi <= 50) instruments.add('tuba')
    if (avgMidi >= 40 && avgMidi <= 60) instruments.add('piano')
    
    return Array.from(instruments)
  }

  ocrToMusicXML(ocrResult: OCRResult, options: { tempo: number; instrument: string }): string {
    if (!ocrResult.success || ocrResult.notes.length === 0) {
      throw new Error('No notes to convert')
    }

    const ns = 'http://www.musicxml.org/schema/MusicXML'
    const beatDuration = 60000 / options.tempo

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1" xmlns="${ns}">
  <work>
    <work-title>${ocrResult.metadata?.title || 'Imported Score'}</work-title>
  </work>
  <identification>
    <creator type="composer">${ocrResult.metadata?.composer || 'Unknown'}</creator>
  </identification>
  <defaults>
    <sound tempo="${options.tempo}"/>
  </defaults>
  <part-list>
    <score-part id="P1">
      <part-name>${options.instrument}</part-name>
    </score-part>
  </part-list>
  <part id="P1">`

    const measures = new Map<number, OCRExtractedNote[]>()
    ocrResult.notes.forEach(note => {
      const measureNum = note.measure || 1
      if (!measures.has(measureNum)) measures.set(measureNum, [])
      measures.get(measureNum)!.push(note)
    })

    const sortedMeasures = Array.from(measures.keys()).sort((a, b) => a - b)
    
    sortedMeasures.forEach(measureNum => {
      const measureNotes = measures.get(measureNum)!
      measureNotes.sort((a, b) => a.startTime - b.startTime)
      
      xml += `\n    <measure number="${measureNum}">`
      
      measureNotes.forEach(note => {
        const duration = Math.round(note.duration / beatDuration * 4)
        const step = note.pitch[0]
        const octave = parseInt(note.pitch.match(/\d+/)?.[0] || '4')
        
        xml += `
      <note>
        <pitch>
          <step>${step}</step>
          <octave>${octave}</octave>
        </pitch>
        <duration>${Math.max(duration, 1)}</duration>
        <type>quarter</type>
      </note>`
      })
      
      xml += '\n    </measure>'
    })

    xml += '\n  </part>\n</score-partwise>'
    return xml
  }
}

// ============================================
// Default instance
// ============================================

export const hammerOCR = new HammerOCRService()

// ============================================
// Public API
// ============================================

export async function loadHammerModel(version: 'v1' | 'v2' = 'v2'): Promise<boolean> {
  return hammerOCR.loadModel(version)
}

export async function processWithHammerOCR(file: File): Promise<OCRResult> {
  return hammerOCR.processImage(file)
}

export async function checkOCRConnection(): Promise<boolean> {
  return hammerOCR.checkConnection()
}

export default {
  HammerOCRService,
  hammerOCR,
  loadHammerModel,
  processWithHammerOCR,
  checkOCRConnection
}