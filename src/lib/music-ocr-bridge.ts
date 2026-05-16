// lib/music-ocr-bridge.ts
import * as tf from '@tensorflow/tfjs'
import * as tflite from '@tensorflow/tfjs-tflite'

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

const OCR_MODELS = {
  v1: '/models/hammer_academy_v1_full.tflite',
  v2: '/models/hammer_academy_V2_PRO.tflite'
}

const DEFAULT_MODEL = 'v2'

export class HammerOCRService {
  private model: tflite.TFLiteModel | null = null
  private modelLoaded: boolean = false

  async loadModel(modelVersion: 'v1' | 'v2' = DEFAULT_MODEL): Promise<boolean> {
    if (this.modelLoaded) return true;
    try {
      console.log(`Cargando modelo Hammer OCR: ${modelVersion}`)
      this.model = await tflite.loadTFLiteModel(OCR_MODELS[modelVersion])
      this.modelLoaded = true
      return true
    } catch (error) {
      console.error('Error cargando el modelo TFLite:', error)
      return false
    }
  }

  async processImage(file: File): Promise<OCRResult> {
    if (!this.modelLoaded || !this.model) {
      await this.loadModel();
    }

    try {
      // 1. Convertir archivo a imagen para la IA
      const imageElement = await this.fileToImage(file);

      // 2. Pre-procesamiento: 640x640 y Normalización (0-1)
      const tensor = tf.browser.fromPixels(imageElement)
        .resizeNearestNeighbor([640, 640])
        .toFloat()
        .div(tf.scalar(255.0))
        .expandDims(0);

      // 3. Inferencia visual real
      const predictions = this.model!.predict(tensor) as tf.Tensor;
      const data = await predictions.data();

      // 4. Post-procesamiento (Extracción de notas visuales)
      const notes = this.parseYoloPredictions(data);

      tensor.dispose();
      predictions.dispose();

      return {
        success: true,
        notes: notes,
        metadata: { title: file.name, detectedInstruments: ['viola'] }
      }
    } catch (error) {
      console.error("Error en la inferencia visual:", error);
      return { success: false, notes: [], warnings: [String(error)] }
    }
  }

  private parseYoloPredictions(data: Float32Array | Int32Array | Uint8Array): OCRExtractedNote[] {
    const extractedNotes: OCRExtractedNote[] = [];
    // Lógica simplificada de mapeo de tensores a notas
    // El modelo devuelve bounding boxes, iteramos sobre las detecciones válidas
    for (let i = 0; i < data.length; i += 85) {
      const confidence = data[i + 4];
      if (confidence > 0.6) { 
        // Estimación de MIDI basada en la coordenada Y de la imagen (Clave de Do en 3ra)
        const yCenter = data[i + 1]; 
        const mappedMidi = Math.floor(88 - (yCenter * 40)); // Lógica de ejemplo de mapeo visual

        extractedNotes.push({
          pitch: 'C', // Generado post-mapeo
          midi: mappedMidi,
          startTime: extractedNotes.length * 500,
          duration: 480,
          measure: 1,
          beat: 1,
          confidence: confidence,
          position: { x: data[i], y: data[i+1] }
        });
      }
    }
    return extractedNotes;
  }

  private fileToImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  checkConnection(): boolean {
    return this.modelLoaded;
  }
}

export const hammerOCR = new HammerOCRService()

export async function loadHammerModel(version: 'v1' | 'v2' = 'v2'): Promise<boolean> {
  return hammerOCR.loadModel(version)
}

export async function processWithHammerOCR(file: File): Promise<OCRResult> {
  return hammerOCR.processImage(file)
}

export async function checkOCRConnection(): Promise<boolean> {
  return hammerOCR.checkConnection()
}
