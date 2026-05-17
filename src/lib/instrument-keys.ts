// Instrument key mappings for Music Trainer
// Each instrument has its own fingering/position system

export interface InstrumentLane {
  key: string           // Keyboard key to press
  position: string      // Display name (e.g., "E string", "1st valve")
  note: string          // The note this key produces
  midi: number          // MIDI number for reference
}

export interface InstrumentConfig {
  name: string
  color: string
  type: 'strings' | 'winds' | 'percussion' | 'keyboard'
  lanes: InstrumentLane[]
  description: string
  range: { low: number; high: number }
}

// ==================== STRING INSTRUMENTS ====================
// Each lane = one string of the instrument
// The note changes based on finger position, but the string stays the same

export const STRING_INSTRUMENTS: Record<string, InstrumentConfig> = {
  violin: {
    name: 'Violin',
    color: '#9b30ff',
    type: 'strings',
    description: '4 strings: G-D-A-E (from low to high)',
    range: { low: 55, high: 103 },
    lanes: [
      { key: 'a', position: 'G string (4th)', note: 'G3', midi: 55 },
      { key: 's', position: 'D string (3rd)', note: 'D4', midi: 62 },
      { key: 'd', position: 'A string (2nd)', note: 'A4', midi: 69 },
      { key: 'f', position: 'E string (1st)', note: 'E5', midi: 76 },
    ]
  },
  viola: {
    name: 'Viola',
    color: '#cc6633',
    type: 'strings',
    description: '4 strings: C-G-D-A (from low to high)',
    range: { low: 50, high: 93 },
    lanes: [
      { key: 'a', position: 'C string', note: 'C3', midi: 48 },
      { key: 's', position: 'G string', note: 'G3', midi: 55 },
      { key: 'd', position: 'D string', note: 'D4', midi: 62 },
      { key: 'f', position: 'A string', note: 'A4', midi: 69 },
    ]
  },
  cello: {
    name: 'Cello',
    color: '#8b4513',
    type: 'strings',
    description: '4 strings: C-G-D-A (from low a high)',
    range: { low: 36, high: 96 },
    lanes: [
      { key: 'a', position: 'C string', note: 'C2', midi: 36 },
      { key: 's', position: 'G string', note: 'G2', midi: 43 },
      { key: 'd', position: 'D string', note: 'D3', midi: 50 },
      { key: 'f', position: 'A string', note: 'A3', midi: 57 },
    ]
  },
  double_bass: {
    name: 'Double Bass',
    color: '#4a3728',
    type: 'strings',
    description: '4 strings: E-A-D-G (from low to high)',
    range: { low: 28, high: 67 },
    lanes: [
      { key: 'a', position: 'E string (low)', note: 'E1', midi: 28 },
      { key: 's', position: 'A string', note: 'A1', midi: 33 },
      { key: 'd', position: 'D string', note: 'D2', midi: 38 },
      { key: 'f', position: 'G string', note: 'G2', midi: 43 },
    ]
  }
}

// ==================== WIND INSTRUMENTS ====================
// Each lane = one valve/button/finger position
// The note is produced by that specific valve combination

export const WIND_INSTRUMENTS: Record<string, InstrumentConfig> = {
  flute: {
    name: 'Flute',
    color: '#87ceeb',
    type: 'winds',
    description: 'Finger keys: open, 1, 2, 3',
    range: { low: 60, high: 108 },
    lanes: [
      { key: 'a', position: 'No fingers (C)', note: 'C4', midi: 60 },
      { key: 's', position: '1st finger (D)', note: 'D4', midi: 62 },
      { key: 'd', position: '2nd finger (E)', note: 'E4', midi: 64 },
      { key: 'f', position: '1+2 fingers (F)', note: 'F4', midi: 65 },
    ]
  },
  oboe: {
    name: 'Oboe',
    color: '#deb887',
    type: 'winds',
    description: 'Finger keys: standard oboe fingerings',
    range: { low: 58, high: 89 },
    lanes: [
      { key: 'a', position: '1st key (C)', note: 'C4', midi: 60 },
      { key: 's', position: '2nd key (D)', note: 'D4', midi: 62 },
      { key: 'd', position: '3rd key (E)', note: 'E4', midi: 64 },
      { key: 'f', position: '4th key (F)', note: 'F4', midi: 65 },
    ]
  },
  clarinet: {
    name: 'Clarinet (Bb)',
    color: '#ffd700',
    type: 'winds',
    description: '3 valves + register key',
    range: { low: 50, high: 103 },
    lanes: [
      { key: 'a', position: 'Valve 1 (C)', note: 'C4', midi: 60 },
      { key: 's', position: 'Valve 2 (D)', note: 'D4', midi: 62 },
      { key: 'd', position: 'Valve 3 (E)', note: 'E4', midi: 64 },
      { key: 'f', position: '1+2 (F)', note: 'F4', midi: 65 },
    ]
  },
  bassoon: {
    name: 'Bassoon',
    color: '#8b7355',
    type: 'winds',
    description: 'Finger keys + whisper key',
    range: { low: 34, high: 75 },
    lanes: [
      { key: 'a', position: 'Low Bb', note: 'Bb2', midi: 34 },
      { key: 's', position: 'B', note: 'B2', midi: 35 },
      { key: 'd', position: 'C', note: 'C3', midi: 36 },
      { key: 'f', position: 'C#', note: 'C#3', midi: 37 },
    ]
  },
  french_horn: {
    name: 'French Horn',
    color: '#daa520',
    type: 'winds',
    description: '3 valves for horn in F',
    range: { low: 41, high: 89 },
    lanes: [
      { key: 'a', position: 'Valve 1 (B)', note: 'B3', midi: 59 },
      { key: 's', position: 'Valve 2 (C)', note: 'C4', midi: 60 },
      { key: 'd', position: 'Valve 3 (D)', note: 'D4', midi: 62 },
      { key: 'f', position: '1+2 (E)', note: 'E4', midi: 64 },
    ]
  },
  trumpet: {
    name: 'Trumpet (Bb)',
    color: '#ff8c00',
    type: 'winds',
    description: '3 valves',
    range: { low: 50, high: 96 },
    lanes: [
      { key: 'a', position: '1st valve (C)', note: 'C4', midi: 60 },
      { key: 's', position: '2nd valve (D)', note: 'D4', midi: 62 },
      { key: 'd', position: '3rd valve (E)', note: 'E4', midi: 64 },
      { key: 'f', position: '1+2 (F)', note: 'F4', midi: 65 },
    ]
  },
  trombone: {
    name: 'Trombone',
    color: '#cd853f',
    type: 'winds',
    description: '7 slide positions + trigger',
    range: { low: 40, high: 75 },
    lanes: [
      { key: 'a', position: 'Position 1 (E)', note: 'E2', midi: 40 },
      { key: 's', position: 'Position 2 (F)', note: 'F2', midi: 41 },
      { key: 'd', position: 'Position 3 (G)', note: 'G2', midi: 43 },
      { key: 'f', position: 'Position 4 (A)', note: 'A2', midi: 45 },
    ]
  },
  tuba: {
    name: 'Tuba',
    color: '#8b7355',
    type: 'winds',
    description: '4 valves',
    range: { low: 28, high: 65 },
    lanes: [
      { key: 'a', position: '1st valve (C)', note: 'C2', midi: 36 },
      { key: 's', position: '2nd valve (D)', note: 'D2', midi: 38 },
      { key: 'd', position: '3rd valve (E)', note: 'E2', midi: 40 },
      { key: 'f', position: '4th valve (F)', note: 'F2', midi: 41 },
    ]
  }
}

// ==================== PERCUSSION INSTRUMENTS ====================
// Each lane = one drum/percussion element

export const PERCUSSION_INSTRUMENTS: Record<string, InstrumentConfig> = {
  timpani: {
    name: 'Timpani',
    color: '#cc8844',
    type: 'percussion',
    description: '4 kettle drums: D-F#-Bb-C',
    range: { low: 40, high: 55 },
    lanes: [
      { key: 'a', position: 'D drum', note: 'D2', midi: 38 },
      { key: 's', position: 'F# drum', note: 'F#2', midi: 42 },
      { key: 'd', position: 'Bb drum', note: 'Bb2', midi: 46 },
      { key: 'f', position: 'C drum', note: 'C3', midi: 48 },
    ]
  },
  snare_drum: {
    name: 'Snare Drum',
    color: '#ddccaa',
    type: 'percussion',
    description: 'Snare drum hits and rudiments',
    range: { low: 60, high: 80 },
    lanes: [
      { key: 'a', position: 'Right hand', note: 'snare', midi: 60 },
      { key: 's', position: 'Left hand', note: 'snare', midi: 60 },
      { key: 'd', position: 'Right stick', note: 'rim', midi: 62 },
      { key: 'f', position: 'Left stick', note: 'rim', midi: 62 },
    ]
  },
  drum_set: {
    name: 'Drum Set',
    color: '#aaaaaa',
    type: 'percussion',
    description: 'Kick, snare, hi-hat, tom, crash',
    range: { low: 35, high: 85 },
    lanes: [
      { key: 'a', position: 'Kick', note: 'kick', midi: 35 },
      { key: 's', position: 'Snare', note: 'snare', midi: 60 },
      { key: 'd', position: 'Hi-hat', note: 'hihat', midi: 66 },
      { key: 'f', position: 'Tom', note: 'tom', midi: 50 },
    ]
  }
}

// ==================== KEYBOARD INSTRUMENTS ====================

export const KEYBOARD_INSTRUMENTS: Record<string, InstrumentConfig> = {
  piano: {
    name: 'Piano',
    color: '#4a4a5a',
    type: 'keyboard',
    description: 'White keys: C-D-E-F',
    range: { low: 21, high: 108 },
    lanes: [
      { key: 'a', position: 'C key', note: 'C4', midi: 60 },
      { key: 's', position: 'D key', note: 'D4', midi: 62 },
      { key: 'd', position: 'E key', note: 'E4', midi: 64 },
      { key: 'f', position: 'F key', note: 'F4', midi: 65 },
    ]
  },
  harp: {
    name: 'Harp',
    color: '#b8a080',
    type: 'keyboard',
    description: 'Pedals + finger positions',
    range: { low: 36, high: 96 },
    lanes: [
      { key: 'a', position: 'Finger 1', note: 'C4', midi: 60 },
      { key: 's', position: 'Finger 2', note: 'D4', midi: 62 },
      { key: 'd', position: 'Finger 3', note: 'E4', midi: 64 },
      { key: 'f', position: 'Finger 4', note: 'F4', midi: 65 },
    ]
  },
  organ: {
    name: 'Organ',
    color: '#5a4030',
    type: 'keyboard',
    description: 'Manual keys + pedals',
    range: { low: 21, high: 108 },
    lanes: [
      { key: 'a', position: 'C manual', note: 'C4', midi: 60 },
      { key: 's', position: 'D manual', note: 'D4', midi: 62 },
      { key: 'd', position: 'E manual', note: 'E4', midi: 64 },
      { key: 'f', position: 'F manual', note: 'F4', midi: 65 },
    ]
  }
}

// ==================== COMBINE ALL INSTRUMENTS ====================

export const ALL_INSTRUMENTS: Record<string, InstrumentConfig> = {
  ...STRING_INSTRUMENTS,
  ...WIND_INSTRUMENTS,
  ...PERCUSSION_INSTRUMENTS,
  ...KEYBOARD_INSTRUMENTS
}

// Helper function to get lanes for an instrument
export function getInstrumentLanes(instrumentKey: string): InstrumentLane[] {
  const instrument = ALL_INSTRUMENTS[instrumentKey]
  return instrument?.lanes || ALL_INSTRUMENTS.violin.lanes
}

// Helper function to get instrument type
export function getInstrumentType(instrumentKey: string): string {
  return ALL_INSTRUMENTS[instrumentKey]?.type || 'strings'
}

// Export for UI display
export function getInstrumentDisplayInfo(instrumentKey: string) {
  const instrument = ALL_INSTRUMENTS[instrumentKey]
  if (!instrument) return null
  
  return {
    name: instrument.name,
    color: instrument.color,
    type: instrument.type,
    description: instrument.description,
    lanes: instrument.lanes.map((lane, index) => ({
      key: lane.key.toUpperCase(),
      label: `${lane.key.toUpperCase()}: ${lane.position}`,
      note: lane.note
    }))
  }
}