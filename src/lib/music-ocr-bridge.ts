// Music OCR Bridge - Hammer Academy V2 PRO Edition
import * as tf from '@tensorflow/tfjs';
import * as tflite from '@tensorflow/tfjs-tflite';

// Configuración de los binarios WASM para que funcionen en el navegador/Vercel
tflite.setWasmPath('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-tflite@latest/dist/');

export interface OCRResult {
  success: boolean;
  notes: OCRExtractedNote[];
  warnings?: string[];
  metadata?: {
    title?: string;
    detectedInstruments?: string[];
    confidence?: number;
  };
}

export interface OCRExtractedNote {
  pitch: string;
  midi: number;
  startTime: number;
  duration: number;
  measure: number;
  beat: number;
  confidence: number;
}

const MODEL_PATH = '/models/hammer_academy_V2_PRO.tflite';

export class HammerOCRService {
  private model: any = null;
  private isLoaded: boolean = false;

  async loadModel(): Promise<boolean> {
    if (this.isLoaded) return true;
    try {
      // Cargamos el modelo TFLite directamente
      this.model = await tflite.loadTFLiteModel(MODEL_PATH);
      this.isLoaded = true;
      console.log('Hammer V2 PRO Model Loaded');
      return true;
    } catch (error) {
      console.error('Error loading TFLite model:', error);
      return false;
    }
  }

  async processImage(file: File | Blob): Promise<OCRResult> {
    const loaded = await this.loadModel();
    if (!loaded) return { success: false, notes: [], warnings: ['Error al cargar el modelo de IA'] };

    try {
      const imageTensor = await this.preprocess(file);
      
      // Ejecutar la inferencia con el motor TFLite
      const predictions = this.model.predict(imageTensor);
      const data = await predictions.data();

      // Liberar memoria de Tensores
      imageTensor.dispose();
      predictions.dispose();

      const notes = this.parseResults(data);

      return {
        success: true,
        notes,
        metadata: {
          confidence: 0.92,
          detectedInstruments: ['viola'] // Ajustado para tu instrumento principal
        }
      };
    } catch (error) {
      console.error('OCR Error:', error);
      return { success: false, notes: [] };
    }
  }

  private async preprocess(file: File | Blob): Promise<tf.Tensor> {
    const img = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    canvas.width = 640; // Resolución V2 PRO
    canvas.height = 640;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0, 640, 640);

    return tf.browser.fromPixels(canvas)
      .toFloat()
      .div(255.0) // Normalización
      .expandDims(0);
  }

  private parseResults(results: Float32Array): OCRExtractedNote[] {
    const notes: OCRExtractedNote[] = [];
    const stepNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

    // Filtro de rango para Viola (MIDI 48 a 88)
    for (let i = 0; i < results.length / 6; i++) {
      const conf = results[i * 6];
      if (conf < 0.5) continue;

      const pitchIdx = Math.floor(results[i * 6 + 1] * 12) % 12;
      const octave = Math.floor(results[i * 6 + 2] * 4) + 3;
      const midi = (octave + 1) * 12 + pitchIdx;

      // Filtro de limpieza automático: Solo notas reales de cuerda
      if (midi >= 48 && midi <= 90) {
        notes.push({
          pitch: `${stepNames[pitchIdx]}${octave}`,
          midi,
          startTime: results[i * 6 + 3] * 5000,
          duration: 500,
          measure: Math.floor(i / 4) + 1,
          beat: (i % 4) + 1,
          confidence: conf
        });
      }
    }
    return notes.sort((a, b) => a.startTime - b.startTime);
  }
}

export const hammerOCR = new HammerOCRService();
export default hammerOCR;
