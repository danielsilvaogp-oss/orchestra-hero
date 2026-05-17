// PDF to MusicXML/MIDI Converter Module
// Supports multiple import methods for sheet music

export interface ConvertResult {
  success: boolean
  musicxml?: string
  midi?: ArrayBuffer
  error?: string
  warnings?: string[]
  metadata?: {
    title?: string
    composer?: string
    instrument?: string
    duration?: number
    noteCount?: number
  }
}

export interface ConversionOptions {
  targetInstrument: string
  includeDynamics: boolean
  tempo: number
}

// Note: This is a simplified converter. For production use,
// you'd want to integrate with a proper music OCR library like
// Audiveris, OpenScore, or external APIs like Google Cloud Vision

export async function convertPDFToMusicXML(
  pdfData: ArrayBuffer, 
  options: ConversionOptions
): Promise<ConvertResult> {
  const warnings: string[] = []
  
  // Method 1: Try to extract text from PDF and parse as MusicXML
  try {
    const text = await extractTextFromPDF(pdfData)
    
    // Check if it's actually a MusicXML file embedded in PDF
    if (text.includes('<?xml') && (text.includes('score-partwise') || text.includes('score-timewise'))) {
      return {
        success: true,
        musicxml: text,
        metadata: extractMetadataFromXML(text),
        warnings: ['PDF contained embedded MusicXML data']
      }
    }
    
    // Method 2: Try to parse as plain text music notation
    // This handles various simple text-based formats
    const parsedNotes = parseTextNotation(text, options.tempo || 120)
    
    if (parsedNotes.length > 0) {
      const musicXML = generateMusicXML(parsedNotes, options)
      return {
        success: true,
        musicxml: musicXML,
        metadata: {
          title: 'Converted from PDF',
          noteCount: parsedNotes.length
        },
        warnings: ['Converted from text extraction. Manual verification recommended.']
      }
    }
    
    // Method 3: Try to detect basic note patterns
    const detectedNotes = detectBasicNotes(text, options.tempo || 120)
    
    if (detectedNotes.length > 0) {
      const musicXML = generateMusicXML(detectedNotes, options)
      return {
        success: true,
        musicxml: musicXML,
        metadata: {
          title: 'Converted from PDF',
          noteCount: detectedNotes.length
        },
        warnings: ['Basic note detection used. Results may vary.']
      }
    }
    
    return {
      success: false,
      error: 'Could not extract musical notation from PDF. The file may be an image or use unsupported notation.'
    }
    
  } catch (error) {
    return {
      success: false,
      error: `Conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

// Helper: Extract text from PDF
async function extractTextFromPDF(pdfData: ArrayBuffer): Promise<string> {
  // Simple text extraction - for production, use pdf.js
  const textDecoder = new TextDecoder('utf-8')
  const text = textDecoder.decode(pdfData)
  
  // Remove binary PDF content, keep text
  const cleanedText = text
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
    .replace(/[\x00-\xFF]+/g, (match) => {
      // Keep only printable ASCII and common music symbols
      return match.replace(/[^\x20-\x7E\n\r\t]/g, ' ')
    })
  
  return cleanedText
}

// Helper: Parse text-based notation
function parseTextNotation(text: string, tempo: number): ParsedNoteData[] {
  const notes: ParsedNoteData[] = []
  const lines = text.split('\n')
  let currentBeat = 0
  const beatDuration = 60000 / tempo
  
  // Common notation patterns
  const notePattern = /([A-Ga-g][#b]?)(\d+)/g
  const restPattern = /(R|Z)/g
  
  for (const line of lines) {
    // Try to extract notes from line
    let match
    while ((match = notePattern.exec(line)) !== null) {
      const note = match[1].toUpperCase()
      const duration = parseInt(match[2]) || 4
      
      notes.push({
        pitch: note,
        octave: 4,
        duration: 4 / duration * beatDuration,
        startBeat: currentBeat
      })
      
      currentBeat += 4 / duration
    }
  }
  
  return notes
}

// Helper: Detect basic note patterns
function detectBasicNotes(text: string, tempo: number): ParsedNoteData[] {
  const notes: ParsedNoteData[] = []
  const beatDuration = 60000 / tempo
  
  // Look for patterns like "C4", "D5", "E4" etc.
  const pattern = /([A-G][#b]?)(\d)/gi
  let match
  let beat = 0
  
  while ((match = pattern.exec(text)) !== null) {
    const pitch = match[1].toUpperCase()
    const octave = parseInt(match[2])
    
    notes.push({
      pitch,
      octave,
      duration: beatDuration,
      startBeat: beat
    })
    
    beat += 4 // Assume quarter notes
  }
  
  return notes
}

// Helper: Generate MusicXML from parsed notes
function generateMusicXML(notes: ParsedNoteData[], options: ConversionOptions): string {
  const ns = 'http://www.musicxml.org/schema/MusicXML'
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1" xmlns="${ns}">
  <work>
    <work-title>Converted Score</work-title>
  </work>
  <identification>
    <creator type="composer">Music Trainer</creator>
  </identification>
  <defaults>
    <sound tempo="${options.tempo}"/>
  </defaults>
  <part-list>
    <score-part id="P1">
      <part-name>${options.targetInstrument}</part-name>
    </score-part>
  </part-list>
  <part id="P1">`
  
  let measureNumber = 1
  let currentBeat = 0
  
  // Group notes into measures (4 beats each)
  for (let i = 0; i < notes.length; i++) {
    const note = notes[i]
    
    if (currentBeat === 0) {
      xml += `\n    <measure number="${measureNumber}">`
      measureNumber++
    }
    
    const duration = Math.round(4 * (note.duration / (60000 / options.tempo)))
    
    xml += `
      <note>
        <pitch>
          <step>${note.pitch[0]}</step>
          <octave>${note.octave}</octave>
        </pitch>
        <duration>${duration}</duration>
        <type>quarter</type>
      </note>`
    
    currentBeat += 4
    if (currentBeat >= 16) {
      currentBeat = 0
      xml += '\n    </measure>'
    }
  }
  
  if (currentBeat > 0) {
    xml += '\n    </measure>'
  }
  
  xml += '\n  </part>\n</score-partwise>'
  
  return xml
}

// Convert MusicXML to MIDI
export async function musicXMLToMidi(musicXML: string, tempo: number = 120): Promise<ArrayBuffer | null> {
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(musicXML, 'text/xml')
    
    // Create MIDI file structure
    const midiTracks: number[][] = []
    
    // Header chunk
    const header = [
      0x4D, 0x54, 0x68, 0x64, // "MThd"
      0x00, 0x00, 0x00, 0x06, // Header length
      0x00, 0x00, // Format 0
      0x00, 0x01, // 1 track
      0x01, 0xE0  // 480 ticks per quarter
    ]
    
    // Parse notes and create track
    const track: number[] = []
    
    // Set tempo (in microseconds)
    const tempoUS = Math.round(60000000 / tempo)
    track.push(
      0x00, 0xFF, 0x51, 0x03,
      (tempoUS >> 16) & 0xFF,
      (tempoUS >> 8) & 0xFF,
      tempoUS & 0xFF
    )
    
    // Parse notes from XML
    const notes = doc.querySelectorAll('note')
    let tickPosition = 0
    
    notes.forEach((note) => {
      const pitchElem = note.querySelector('pitch step')
      const octaveElem = note.querySelector('pitch octave')
      const durationElem = note.querySelector('duration')
      
      if (pitchElem && octaveElem && durationElem) {
        const step = pitchElem.textContent || 'C'
        const octave = parseInt(octaveElem.textContent || '4')
        const duration = parseInt(durationElem.textContent || '4')
        
        // Convert to MIDI note
        const stepToMidi: Record<string, number> = { 'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11 }
        const midiNote = (octave + 1) * 12 + (stepToMidi[step] || 0)
        
        // Note on
        track.push(
          0x00, 0x90, midiNote, 0x64
        )
        
        // Note off
        const tickDuration = duration * 120 // ticks
        track.push(
          (tickDuration >> 8) & 0xFF,
          tickDuration & 0xFF,
          0x80, midiNote, 0x00
        )
        
        tickPosition += tickDuration
      }
    })
    
    // End of track
    track.push(0x00, 0xFF, 0x2F, 0x00)
    
    // Calculate track length
    const trackLength = track.length
    const trackChunk = [
      0x4D, 0x54, 0x72, 0x6B, // "MTrk"
      (trackLength >> 24) & 0xFF,
      (trackLength >> 16) & 0xFF,
      (trackLength >> 8) & 0xFF,
      trackLength & 0xFF,
      ...track
    ]
    
    // Combine header and track
    const midiFile = new Uint8Array([...header, ...trackChunk])
    return midiFile.buffer
    
  } catch (error) {
    console.error('MIDI conversion error:', error)
    return null
  }
}

// Extract metadata from MusicXML
function extractMetadataFromXML(xml: string): { title?: string; composer?: string } {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xml, 'text/xml')
  
  const title = doc.querySelector('work-title')?.textContent || 
               doc.querySelector('movement-title')?.textContent
  const composer = doc.querySelector('creator[type="composer"]')?.textContent
  
  return { title, composer }
}

// Type for parsed notes
interface ParsedNoteData {
  pitch: string
  octave: number
  duration: number
  startBeat: number
}

// Sample songs library
export const SAMPLE_SONGS = [
  {
    id: 'ode_to_joy',
    title: 'Ode to Joy',
    composer: 'Beethoven',
    difficulty: 'beginner',
    tempo: 120,
    instruments: ['violin', 'flute'],
    category: 'classical',
    description: 'Famous theme from Symphony No. 9'
  },
  {
    id: 'twinkle_twinkle',
    title: 'Twinkle Twinkle Little Star',
    composer: 'Traditional',
    difficulty: 'beginner',
    tempo: 90,
    instruments: ['violin', 'piano'],
    category: 'children',
    description: 'Classic children song'
  },
  {
    id: 'canon',
    title: 'Canon in D',
    composer: 'Pachelbel',
    difficulty: 'intermediate',
    tempo: 70,
    instruments: ['violin', 'cello'],
    category: 'baroque',
    description: 'Famous Baroque piece'
  },
  {
    id: 'fur_elise',
    title: 'Für Elise',
    composer: 'Beethoven',
    difficulty: 'intermediate',
    tempo: 120,
    instruments: ['piano'],
    category: 'classical',
    description: 'Beloved piano piece'
  },
  {
    id: 'flight_bumblebee',
    title: 'Flight of the Bumblebee',
    composer: 'Rimsky-Korsakov',
    difficulty: 'expert',
    tempo: 180,
    instruments: ['flute'],
    category: 'classical',
    description: 'Virtuoso showpiece'
  }
]

// Export for use
export default {
  convertPDFToMusicXML,
  musicXMLToMidi,
  SAMPLE_SONGS,
  extractMetadataFromXML
}