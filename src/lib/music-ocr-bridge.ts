// Music OCR Bridge - Hammer Academy V2 PRO Edition
import * as tf from '@tensorflow/tfjs';

// NOTA: Hemos eliminado la importación estática de 'tfjs-tflite' aquí
// para evitar que Webpack explote en el build de Vercel.

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
      console.log(`Loading Hammer OCR model: ${modelVersion}`);
      
      // CARGA DINÁMICA: Esta es la clave. 
      // Solo se descarga cuando el músico abre la app en el navegador.
      const tflite = await import('@tensorflow/tfjs-tflite');
      
      // Configuración de binarios externos
      tflite.setWasmPath('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-tflite@latest/dist/');
      
      const modelPath = OCR_MODELS[modelVersion];
      
      // Cargamos el modelo TFLite
      this.model = await tflite.loadTFLiteModel(modelPath);
      this.modelLoaded = true;
      
      console.log('Hammer Academy V2 PRO cargado exitosamente');
      return true;
    } catch (error) {
      console.error('Failed to load Hammer OCR model:', error);
      this.modelLoaded = false;
      return false;
    }
  }

  async processImage(file: File | Blob): Promise<OCRResult> {
    const loaded = await this.loadModel();
    if (!loaded) return { success: false, notes: [], warnings: ['Error al cargar el modelo de IA'] };

    try {
      const imageTensor = await this.preprocess(file);
      
      // Inferencia
      const predictions = this.model.predict(imageTensor);
      const data = await predictions.data();

      // Limpiar memoria de Tensores (Muy importante para no crashear el navegador)
      imageTensor.dispose();
      predictions.dispose();

      const notes = this.parseResults(data);

      return {
        success: true,
        notes,
        metadata: {
          confidence: 0.92,
          detectedInstruments: ['viola'] // Rango de viola optimizado
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

    // Filtro de rango para Viola (MIDI 48 - Do3 hasta 90)
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
