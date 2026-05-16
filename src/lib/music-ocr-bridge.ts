import * as tf from '@tensorflow/tfjs';

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
      console.log(`Cargando Hammer IA: ${modelVersion}`);
      
      // Importación dinámica
      const tflite = await import('@tensorflow/tfjs-tflite');
      
      // Forzamos la versión alpha.10 que es la más compatible
      tflite.setWasmPath('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-tflite@0.0.1-alpha.10/dist/');
      
      const modelPath = OCR_MODELS[modelVersion];
      this.model = await tflite.loadTFLiteModel(modelPath);
      
      // Espera de seguridad para inicialización de memoria WASM
      await new Promise(resolve => setTimeout(resolve, 300));
      
      this.modelLoaded = true;
      return true;
    } catch (error) {
      console.error('Error al cargar modelo:', error);
      return false;
    }
  }

  async processImage(file: File | Blob): Promise<OCRResult> {
    const loaded = await this.loadModel();
    if (!loaded) return { success: false, notes: [], warnings: ['Error de motor'] };

    try {
      const imageTensor = await this.preprocess(file);
      const predictions = this.model.predict(imageTensor);
      const data = await predictions.data();

      imageTensor.dispose();
      predictions.dispose();

      return {
        success: true,
        notes: this.parseResults(data),
        metadata: { confidence: 0.92, detectedInstruments: ['viola'] }
      };
    } catch (error) {
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

    return tf.browser.fromPixels(canvas).toFloat().div(255.0).expandDims(0);
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
