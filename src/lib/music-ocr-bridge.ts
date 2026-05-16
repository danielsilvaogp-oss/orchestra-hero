// Music OCR Bridge - Hammer Academy V2 PRO Edition
import * as tf from '@tensorflow/tfjs';

// Definimos la interfaz para que TypeScript no se queje del objeto global
declare global {
  interface Window {
    tflite: any;
  }
}

export interface OCRResult {
  success: boolean;
  notes: OCRExtractedNote[];
  warnings?: string[];
  metadata?: {
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

const OCR_MODELS = {
  v1: '/models/hammer_academy_v1_full.tflite',
  v2: '/models/hammer_academy_V2_PRO.tflite'
};

export class HammerOCRService {
  private model: any = null;
  private modelLoaded: boolean = false;

  async loadModel(modelVersion: 'v1' | 'v2' = 'v2'): Promise<boolean> {
    if (this.modelLoaded) return true;

    try {
      console.log(`Iniciando motor Hammer IA (External Script): ${modelVersion}`);
      
      // 1. CARGA DINÁMICA DEL SCRIPT (Evita errores de Webpack/Vercel)
      if (!window.tflite) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-tflite@0.0.1-alpha.10/dist/tf-tflite.min.js';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      const tflite = window.tflite;
      
      // 2. Configuración de WASM
      tflite.setWasmPath('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-tflite@0.0.1-alpha.10/dist/');
      
      const modelPath = OCR_MODELS[modelVersion];
      
      // 3. Carga del modelo
      this.model = await tflite.loadTFLiteModel(modelPath);
      this.modelLoaded = true;
      
      console.log('Hammer Academy V2 PRO: Motor cargado desde CDN con éxito');
      return true;
    } catch (error) {
      console.error('Error crítico en el motor de IA:', error);
      return false;
    }
  }

  async processImage(file: File | Blob): Promise<OCRResult> {
    const loaded = await this.loadModel();
    if (!loaded) return { success: false, notes: [], warnings: ['Error al inicializar IA'] };

    try {
      const imageTensor = await this.preprocess(file);
      const predictions = this.model.predict(imageTensor);
      const data = await predictions.data();

      imageTensor.dispose();
      predictions.dispose();

      const notes = this.parseResults(data);

      return {
        success: true,
        notes,
        metadata: { confidence: 0.92, detectedInstruments: ['viola'] }
      };
    } catch (error) {
      console.error('OCR Error:', error);
      return { success: false, notes: [] };
    }
  }

  private async preprocess(file: File | Blob): Promise<tf.Tensor> {
    const img = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    canvas.width = 640; 
    canvas.height = 640;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0, 640, 640);

    return tf.browser.fromPixels(canvas)
      .toFloat()
      .div(255.0) 
      .expandDims(0);
  }

  private parseResults(results: Float32Array): OCRExtractedNote[] {
    const notes: OCRExtractedNote[] = [];
    const stepNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

    for (let i = 0; i < results.length / 6; i++) {
      const conf = results[i * 6];
      if (conf < 0.5) continue;
      const pitchIdx = Math.floor(results[i * 6 + 1] * 12) % 12;
      const octave = Math.floor(results[i * 6 + 2] * 4) + 3;
      const midi = (octave + 1) * 12 + pitchIdx;

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
