// ============================================================
// A) ENUM: Tipos de instrumentos por familia
// ============================================================

export enum InstrumentType {
  // Cuerdas (Strings)
  violin = 'violin',
  viola = 'viola',
  cello = 'cello',
  double_bass = 'double_bass',
  
  // Vientos Metal (Brass)
  trumpet = 'trumpet',
  french_horn = 'french_horn',
  trombone = 'trombone',
  tuba = 'tuba',
  
  // Vientos Madera (Woodwind)
  flute = 'flute',
  clarinet = 'clarinet',
  oboe = 'oboe',
  bassoon = 'bassoon',
  
  // Percusión
  timpani = 'timpani',
  snare_drum = 'snare_drum',
  drum_set = 'drum_set',
  
  // Teclado
  piano = 'piano',
  harp = 'harp',
  organ = 'organ'
}

// Categorías de instrumentos
export enum InstrumentFamily {
  strings = 'strings',
  brass = 'brass',
  woodwind = 'woodwind',
  percussion = 'percussion',
  keyboard = 'keyboard'
}

// ============================================================
// B) MODELO DE DATOS: Metadata polimórfico (Sealed Class)
// ============================================================

// Interfaz base sellada para metadata específico por instrumento
export type InstrumentMetadata = 
  | StringFingeringMetadata 
  | BrassValveMetadata 
  | WoodwindKeyMetadata 
  | PercussionHitMetadata 
  | KeyboardKeyMetadata

// --- Cuerdas: Posición en el diapasón ---
export interface StringFingeringMetadata {
  type: 'string'
  stringNumber: 1 | 2 | 3 | 4  // 1 = primera cuerda (más aguda)
  position: number            // Posición del dedo en el mástil (0 = al aire)
  finger: 'open' | 1 | 2 | 3 | 4  // Dedo a usar
  stringName: string         // Nombre de la cuerda (E, A, D, G)
}

// --- Vientos Metal: Combinación de pistones ---
export interface BrassValveMetadata {
  type: 'brass'
  valves: [boolean, boolean, boolean]  // [1º, 2º, 3º] - true = presionado
  valveCombination: string          // Display: "1+2", "2+3", etc.
  position?: number                // Slide position (trombone)
  trigger?: boolean                // Trigger/triggering (trombone)
}

// --- Vientos Madera: Llaves de los dedos ---
export interface WoodwindKeyMetadata {
  type: 'woodwind'
  keys: boolean[]           // which fingers are pressed
  keyCombination: string   // Display: "1+2", "all", etc.
  coveredHoles: number    // Covered holes count
  registerKey?: boolean    // Register key for clarinet
}

// --- Percusión: Golpe específico ---
export interface PercussionHitMetadata {
  type: 'percussion'
  element: string           // Which drum/cymbal
  hand: 'left' | 'right' | 'both'
  technique: string         // "rim", "center", "edge"
}

// --- Teclado: Tecla específica ---
export interface KeyboardKeyMetadata {
  type: 'keyboard'
  keyName: string          // "C4", "D4", etc.
  isBlackKey: boolean      // Si es tecla negra
  finger: 1 | 2 | 3 | 4 | 5
}

// ============================================================
// C) MODELO: Nota orquestal completa
// ============================================================

export interface OrchestralNote {
  id: string
  midi: number                      // MIDI number (0-127)
  pitch: string                     // e.g., "A4", "C#5"
  startTime: number                 // ms desde inicio del juego
  duration: number                 // ms de duración
  instrument: InstrumentType        // Instrumento destino
  metadata: InstrumentMetadata     // Metadata específica
  
  // Metadata visual para rendering
  laneIndex: number                 // Índice de lane (0-3)
  expectedInput: string            // Input esperado: "A", "S", "D", "F"
}

// ============================================================
// D) VALIDADOR: Verificar digitación exacta
// ============================================================

export interface InputResult {
  isValid: boolean
  accuracy: 'perfect' | 'good' | 'miss'
  timingDelta: number              // ms de diferencia
  inputProvided: string            // Qué input dio el usuario
  expectedInput: string            // Qué input se esperaba
}

// Validador principal
export function checkHitAccuracy(
  note: OrchestralNote,
  userInput: string,
  timingMs: number
): InputResult {
  const expectedInput = note.expectedInput.toLowerCase()
  const inputMatches = userInput.toLowerCase() === expectedInput
  
  // Calcular precisión de timing (±50ms perfect, ±100ms good)
  const timingDelta = Math.abs(timingMs - note.startTime)
  
  let accuracy: 'perfect' | 'good' | 'miss'
  
  if (!inputMatches) {
    accuracy = 'miss'
  } else if (timingDelta <= 50) {
    accuracy = 'perfect'
  } else if (timingDelta <= 100) {
    accuracy = 'good'
  } else {
    accuracy = 'miss'
  }
  
  return {
    isValid: inputMatches,
    accuracy,
    timingDelta,
    inputProvided: userInput,
    expectedInput: note.expectedInput
  }
}

// Validación específica por familia de instrumento
export function validateInstrumentFingering(
  note: OrchestralNote,
  inputState: InstrumentInputState
): { isCorrect: boolean; message: string } {
  
  switch (note.metadata.type) {
    case 'string': {
      const meta = note.metadata as StringFingeringMetadata
      // En cuerdas, el input es la posición en el mástil
      return {
        isCorrect: inputState.string === meta.stringNumber,
        message: meta.finger === 'open' 
          ? `Tocar al aire en cuerda ${meta.stringName}`
          : `Pisar posición ${meta.position} con dedo ${meta.finger}`
      }
    }
    
    case 'brass': {
      const meta = note.metadata as BrassValveMetadata
      const pressed = [inputState.valve1, inputState.valve2, inputState.valve3]
      const isCorrect = pressed[0] === meta.valves[0] &&
                        pressed[1] === meta.valves[1] &&
                        pressed[2] === meta.valves[2]
      return {
        isCorrect,
        message: `Pistones: ${meta.valveCombination}`
      }
    }
    
    case 'woodwind': {
      const meta = note.metadata as WoodwindKeyMetadata
      const isCorrect = inputState.fingerKeys.every((pressed, i) => 
        pressed === (meta.keys[i] || false)
      )
      return {
        isCorrect,
        message: `Dedos: ${meta.keyCombination}`
      }
    }
    
    default:
      return { isCorrect: true, message: 'OK' }
  }
}

// Estado de inputs del usuario
export interface InstrumentInputState {
  // Strings
  string?: number
  
  // Brass
  valve1?: boolean
  valve2?: boolean
  valve3?: boolean
  trigger?: boolean
  
  // Woodwind
  fingerKeys: boolean[]
  
  // Percussion/Keyboard
  keyPressed?: string
  hand?: 'left' | 'right'
}

// ============================================================
// E) UTILIDADES: Conversión de nota a metadata
// ============================================================

export function inferMetadataFromNote(
  note: string,
  instrument: InstrumentType
): InstrumentMetadata {
  const family = getInstrumentFamily(instrument)
  
  switch (family) {
    case InstrumentFamily.strings:
      return inferStringFingering(note, instrument)
    case InstrumentFamily.brass:
      return inferBrassValves(note, instrument)
    case InstrumentFamily.woodwind:
      return inferWoodwindKeys(note, instrument)
    case InstrumentFamily.keyboard:
      return inferKeyboardKey(note)
    default:
      return { type: 'percussion', element: 'default', hand: 'right', technique: 'center' }
  }
}

function inferStringFingering(note: string, instrument: InstrumentType): StringFingeringMetadata {
  // Parse note (e.g., "A4" -> A, octave 4)
  const match = note.match(/^([A-G]#?)(\d)$/)
  if (!match) return { type: 'string', stringNumber: 1, position: 0, finger: 'open', stringName: 'E' }
  
  const [, pitch, octave] = match
  const oct = parseInt(octave)
  
  // Map pitch to string and position (simplified)
  const stringMap: Record<string, { string: 1|2|3|4; pos: number; finger: 'open'|1|2|3|4 }> = {
    'E': { string: 1, pos: 0, finger: 'open' },
    'F': { string: 1, pos: 1, finger: 1 },
    'F#': { string: 1, pos: 1, finger: 2 },
    'G': { string: 1, pos: 3, finger: 3 },
    'A': { string: 2, pos: 0, finger: 'open' },
    'B': { string: 2, pos: 2, finger: 2 },
    'C': { string: 3, pos: 1, finger: 1 },
    'D': { string: 3, pos: 3, finger: 3 },
  }
  
  const mapping = stringMap[pitch] || { string: 1, pos: 0, finger: 'open' }
  const stringNames: Record<number, string> = { 1: 'E', 2: 'A', 3: 'D', 4: 'G' }
  
  return {
    type: 'string',
    stringNumber: mapping.string,
    position: mapping.pos,
    finger: mapping.finger,
    stringName: stringNames[mapping.string]
  }
}

function inferBrassValves(note: string, instrument: InstrumentType): BrassValveMetadata {
  // Simplified valve inference for common notes
  const noteValveMap: Record<string, [boolean, boolean, boolean]> = {
    'C': [true, false, false],
    'D': [false, true, false],
    'E': [true, true, false],
    'F': [false, false, true],
    'G': [true, false, true],
    'A': [false, true, true],
    'B': [true, true, true],
  }
  
  const pitch = note.replace(/\d/g, '')
  const valves = noteValveMap[pitch] || [true, false, false]
  
  const combo = valves.map((v, i) => v ? i + 1 : null).filter(v => v !== null).join('+')
  
  return {
    type: 'brass',
    valves: [valves[0], valves[1], valves[2]],
    valveCombination: combo || 'none'
  }
}

function inferWoodwindKeys(note: string, instrument: InstrumentType): WoodwindKeyMetadata {
  // Simplified key inference
  const keyMap: Record<string, boolean[]> = {
    'C': [false, false, false],
    'D': [true, false, false],
    'E': [true, true, false],
    'F': [true, true, true],
  }
  
  const pitch = note.replace(/\d/g, '')
  const keys = keyMap[pitch] || [false, false, false]
  
  return {
    type: 'woodwind',
    keys,
    keyCombination: keys.map((k, i) => k ? (i + 1).toString() : '').filter(x => x).join('+') || 'open',
    coveredHoles: keys.filter(k => k).length
  }
}

function inferKeyboardKey(note: string): KeyboardKeyMetadata {
  const isBlack = note.includes('#')
  const fingerMap: Record<string, 1|2|3|4|5> = {
    'C': 1, 'D': 2, 'E': 3, 'F': 4, 'G': 5, 'A': 1, 'B': 2
  }
  
  const pitch = note.replace(/\d/, '')
  
  return {
    type: 'keyboard',
    keyName: note,
    isBlackKey: isBlack,
    finger: fingerMap[pitch] || 1
  }
}

// ============================================================
// F) HELPERS
// ============================================================

export function getInstrumentFamily(type: InstrumentType): InstrumentFamily {
  const stringInstruments = ['violin', 'viola', 'cello', 'double_bass']
  const brassInstruments = ['trumpet', 'french_horn', 'trombone', 'tuba']
  const woodwindInstruments = ['flute', 'clarinet', 'oboe', 'bassoon']
  const percussionInstruments = ['timpani', 'snare_drum', 'drum_set']
  const keyboardInstruments = ['piano', 'harp', 'organ']
  
  if (stringInstruments.includes(type)) return InstrumentFamily.strings
  if (brassInstruments.includes(type)) return InstrumentFamily.brass
  if (woodwindInstruments.includes(type)) return InstrumentFamily.woodwind
  if (percussionInstruments.includes(type)) return InstrumentFamily.percussion
  if (keyboardInstruments.includes(type)) return InstrumentFamily.keyboard
  
  return InstrumentFamily.strings
}

export function isStringInstrument(type: InstrumentType): boolean {
  return getInstrumentFamily(type) === InstrumentFamily.strings
}

export function isWindInstrument(type: InstrumentType): boolean {
  const family = getInstrumentFamily(type)
  return family === InstrumentFamily.brass || family === InstrumentFamily.woodwind
}

export function isBrassInstrument(type: InstrumentType): boolean {
  return getInstrumentFamily(type) === InstrumentFamily.brass
}

export function isWoodwindInstrument(type: InstrumentType): boolean {
  return getInstrumentFamily(type) === InstrumentFamily.woodwind
}