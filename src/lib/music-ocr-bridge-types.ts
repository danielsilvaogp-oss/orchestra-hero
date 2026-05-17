// Type definitions for Music OCR Bridge
// Used across the application for type safety

export interface OCRExtractedNote {
  pitch: string          // e.g., "C4", "F#5"
  midi: number           // MIDI note number (0-127)
  startTime: number      // milliseconds from start
  duration: number        // duration in milliseconds
  measure: number        // measure number
  beat: number           // beat within measure (1-4)
  confidence: number     // model confidence (0-1)
  position?: {
    x: number           // X position in original image
    y: number           // Y position in original image
  }
}

export interface OCRResult {
  success: boolean
  notes: OCRExtractedNote[]
  warnings?: string[]
  metadata?: {
    title?: string
    composer?: string
    detectedInstruments?: string[]
    confidence: number
  }
}

export interface InstrumentRange {
  min: number
  max: number
}

export const INSTRUMENT_RANGES: Record<string, InstrumentRange> = {
  violin: { min: 55, max: 103 },    // E4 to C8
  viola: { min: 48, max: 90 },     // C3 to Bb5
  cello: { min: 36, max: 96 },      // C2 to C6
  double_bass: { min: 28, max: 67 }, // E1 to G3
  flute: { min: 60, max: 108 },     // C4 to C8
  clarinet: { min: 50, max: 103 },  // Bb3 to Bb6
  oboe: { min: 58, max: 89 },       // Bb3 to F5
  trumpet: { min: 55, max: 96 },     // G3 to C6
}

export {
  OCRExtractedNote,
  OCRResult,
  InstrumentRange,
  INSTRUMENT_RANGES
}