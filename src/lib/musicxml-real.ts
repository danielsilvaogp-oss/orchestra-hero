// Real MusicXML Parser and Generator
// Parses PDF-converted MusicXML files and generates proper output

export interface Note {
  pitch: string
  midi: number
  duration: number
  measure: number
  beat: number
  startTime?: number
}

export interface ParsedScore {
  title: string
  composer: string
  tempo: number
  notes: Note[]
  measures: number
}

// Parse any MusicXML to get notes
export function parseMusicXML(xmlString: string): ParsedScore {
  const notes: Note[] = []
  let title = 'Untitled'
  let composer = 'Unknown'
  let tempo = 120
  
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(xmlString, 'text/xml')
    
    // Get metadata
    const workTitle = doc.querySelector('work-title')?.textContent
    const movementTitle = doc.querySelector('movement-title')?.textContent
    title = workTitle || movementTitle || 'Untitled'
    
    const creator = doc.querySelector('creator[type="composer"]')?.textContent
    composer = creator || 'Unknown'
    
    const soundTempo = doc.querySelector('sound[tempo]')?.getAttribute('tempo')
    if (soundTempo) tempo = parseInt(soundTempo)
    
    // Get all notes
    const stepToMidi: Record<string, number> = {
      'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11
    }
    
    const noteElements = doc.querySelectorAll('note')
    let startTime = 0
    let currentMeasure = 1
    
    noteElements.forEach((noteEl) => {
      // Skip chords, rests, grace notes
      if (noteEl.querySelector('chord') || noteEl.querySelector('rest') || noteEl.querySelector('grace')) {
        return
      }
      
      const pitchEl = noteEl.querySelector('pitch')
      if (!pitchEl) return
      
      const step = pitchEl.querySelector('step')?.textContent || 'C'
      const octave = parseInt(pitchEl.querySelector('octave')?.textContent || '4')
      const alter = pitchEl.querySelector('alter')?.textContent
      
      // Handle sharps/flats
      const isSharp = alter === '1' || alter === '#'
      const isFlat = alter === '-1' || step.match(/^[A-G]b$/)
      
      let midi = (octave + 1) * 12 + (stepToMidi[step] || 0)
      if (isSharp) midi += 1
      if (isFlat) midi -= 1
      
      const pitch = isSharp ? `${step}#${octave}` : isFlat ? `${step}b${octave}` : `${step}${octave}`
      
      // Get duration
      const durationEl = noteEl.querySelector('duration')
      const duration = durationEl ? parseInt(durationEl.textContent || '4') * 250 : 500
      
      // Get measure number
      const measureEl = noteEl.closest('measure')
      const measureNum = measureEl ? parseInt(measureEl.getAttribute('number') || '1') : currentMeasure
      
      // Get beat position
      const beatEl = noteEl.querySelector('voice') || noteEl.querySelector('stem')
      const beat = 1
      
      // Check for dot (augmented duration)
      const isDotted = noteEl.querySelector('dot')
      const finalDuration = isDotted ? duration * 1.5 : duration
      
      notes.push({
        pitch,
        midi,
        duration: finalDuration,
        measure: measureNum,
        beat
      })
      
      startTime += finalDuration + 50
      currentMeasure = measureNum
    })
    
    // Calculate total measures
    const measures = Math.max(...notes.map(n => n.measure), 1)
    
    return { title, composer, tempo, notes, measures }
  } catch (e) {
    console.error('Parse error:', e)
    return { title, composer, tempo, notes: [], measures: 1 }
  }
}

// Generate proper MusicXML from notes
export function generateMusicXML(notes: Note[], options: { title?: string; tempo?: number; instrument?: string } = {}): string {
  const ns = 'http://www.musicxml.org/schema/MusicXML'
  const tempo = options.tempo || 120
  const instrument = options.instrument || 'Piano'
  const title = options.title || 'Untitled'
  
  // Group notes by measure
  const measuresMap = new Map<number, Note[]>()
  notes.forEach(note => {
    const m = note.measure || 1
    if (!measuresMap.has(m)) measuresMap.set(m, [])
    measuresMap.get(m)!.push(note)
  })
  
  const sortedMeasures = Array.from(measuresMap.keys()).sort((a, b) => a - b)
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1" xmlns="${ns}">
  <work>
    <work-title>${title}</work-title>
  </work>
  <identification>
    <creator type="composer">Music Trainer</creator>
  </identification>
  <defaults>
    <scaling><millimeters>7</millimeters><tenths>40</tenths></scaling>
    <sound tempo="${tempo}"/>
  </defaults>
  <part-list>
    <score-part id="P1">
      <part-name>${instrument}</part-name>
    </score-part>
  </part-list>
  <part id="P1">`
  
  sortedMeasures.forEach(measureNum => {
    const measureNotes = measuresMap.get(measureNum)!
    measureNotes.sort((a, b) => (a.startTime || 0) - (b.startTime || 0))
    
    xml += `\n    <measure number="${measureNum}">`
    
    measureNotes.forEach(note => {
      const step = note.pitch.replace(/[0-9#b]/g, '')
      const octave = note.pitch.match(/\d+/)?.[0] || '4'
      const isSharp = note.pitch.includes('#')
      const isFlat = note.pitch.includes('b')
      
      // Convert duration to MusicXML type
      let type = 'quarter'
      if (note.duration >= 4000) type = 'whole'
      else if (note.duration >= 2000) type = 'half'
      else if (note.duration >= 1000) type = 'quarter'
      else if (note.duration >= 500) type = 'eighth'
      else type = '16th'
      
      xml += `\n      <note>`
      xml += `\n        <pitch><step>${step}</step><octave>${octave}</octave>${isSharp ? '<alter>1</alter>' : isFlat ? '<alter>-1</alter>' : ''}</pitch>`
      xml += `\n        <duration>${Math.round(note.duration / 250)}</duration>`
      xml += `\n        <type>${type}</type>`
      xml += `\n      </note>`
    })
    
    xml += '\n    </measure>'
  })
  
  xml += '\n  </part>\n</score-partwise>'
  
  return xml
}

// Generate proper MIDI from notes
export function generateMIDI(notes: Note[], tempo: number = 120): Uint8Array {
  const PPQ = 480
  const microsecondsPerBeat = 60000000 / tempo
  
  // Sort by start time
  const sortedNotes = [...notes].sort((a, b) => {
    const aTime = (a.measure - 1) * 4000 + a.beat * 500
    const bTime = (b.measure - 1) * 4000 + b.beat * 500
    return aTime - bTime
  })
  
  const events: number[] = []
  let currentTime = 0
  
  sortedNotes.forEach(note => {
    const startTime = (note.measure - 1) * 4000 + (note.beat - 1) * 500
    const startTicks = Math.round((startTime / 1000) * (microsecondsPerBeat / 1000) * PPQ / 60000)
    const durationTicks = Math.round((note.duration / 1000) * (microsecondsPerBeat / 1000) * PPQ / 60000)
    
    // Note On
    events.push(0x90, note.midi, 0x40)
    // Note Off (after duration)
    events.push(...varLength(startTicks + durationTicks), ...varLength(0), 0x80, note.midi, 0x00)
  })
  
  // MIDI Header: MThd
  const header = [0x4D, 0x54, 0x68, 0x64, 0x00, 0x00, 0x00, 0x06, 0x00, 0x01, 0x00, 0x01, 0x00, 0x80]
  
  // Track Header: MTrk
  const trackData = events.flat()
  const trackHeader = [0x4D, 0x54, 0x72, 0x6B, ...uint32(trackData.length), ...trackData]
  
  return new Uint8Array([...header, ...trackHeader])
}

function varLength(value: number): number[] {
  const bytes: number[] = []
  bytes.push(value & 0x7F)
  while (value > 127) {
    value >>= 7
    bytes.unshift((value & 0x7F) | 0x80)
  }
  return bytes
}

function uint32(value: number): number[] {
  return [(value >> 24) & 0xFF, (value >> 16) & 0xFF, (value >> 8) & 0xFF, value & 0xFF]
}

// Download helpers
export function downloadFile(content: string | Uint8Array, filename: string, mimeType: string) {
  let blob: Blob
  if (content instanceof Uint8Array) {
    // Convert to binary string for MIDI
    let binary = ''
    for (let i = 0; i < content.length; i++) {
      binary += String.fromCharCode(content[i])
    }
    blob = new Blob([binary], { type: mimeType })
  } else {
    blob = new Blob([content], { type: mimeType })
  }
  
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default {
  parseMusicXML,
  generateMusicXML,
  generateMIDI,
  downloadFile
}