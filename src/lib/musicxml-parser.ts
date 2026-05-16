export interface ParsedNote {
  pitch: string
  midi: number
  startMs: number
  durationMs: number
  lane: number
  track: number
  instrument: string
  fingering?: string
  string?: string
  dynamic?: string
  articulations?: string[]
}

export interface ParsedSong {
  title: string
  composer: string
  tempo: number
  timeSignature: { beats: number; beatType: number }
  parts: {
    id: string
    name: string
    instrument: string
    notes: ParsedNote[]
  }[]
}

const NOTE_DURATION_MAP: Record<string, number> = {
  'whole': 4,
  'half': 2,
  'quarter': 1,
  'eighth': 0.5,
  '16th': 0.25,
  '32nd': 0.125,
}

const STEP_TO_SEMITONE: Record<string, number> = {
  'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11
}

function stepToMidi(step: string, octave: number, alter: number = 0): number {
  return (octave + 1) * 12 + (STEP_TO_SEMITONE[step] || 0) + alter
}

export function parseMusicXML(xmlString: string): ParsedSong | null {
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(xmlString, 'text/xml')
    
    // Get namespace
    const root = doc.documentElement
    const nsMatch = root.tagName.match(/\{(.*?)\}/)
    const ns = nsMatch ? nsMatch[1] : ''
    const getNS = (tag: string) => ns ? `{${ns}}${tag}` : tag
    
    // Parse metadata
    const title = doc.querySelector(getNS('work-title') + ', work-title')?.textContent || 'Untitled'
    const composer = doc.querySelector(getNS('creator') + ', creator')?.textContent || 'Unknown'
    
    // Parse tempo
    let tempo = 120
    const sound = doc.querySelector(getNS('sound') + ', sound')
    if (sound?.getAttribute('tempo')) {
      tempo = parseFloat(sound.getAttribute('tempo')!)
    }
    
    // Parse time signature
    let beats = 4, beatType = 4
    const timeElement = doc.querySelector(getNS('beats') + ', beats')
    const beatTypeElement = doc.querySelector(getNS('beat-type') + ', beat-type')
    if (timeElement && beatTypeElement) {
      beats = parseInt(timeElement.textContent || '4')
      beatType = parseInt(beatTypeElement.textContent || '4')
    }
    
    const beatDuration = 60000 / tempo
    
    // Parse parts
    const parts: ParsedSong['parts'] = []
    const partsElements = doc.querySelectorAll('part')
    
    partsElements.forEach((partElem, partIndex) => {
      const partId = partElem.getAttribute('id') || `part-${partIndex}`
      const measures = partElem.querySelectorAll('measure')
      
      const partNotes: ParsedNote[] = []
      let currentBeat = 0
      
      // Get part name from part-list
      const partNameEl = doc.querySelector(`score-part[id="${partId}"] part-name`)
      const partName = partNameEl?.textContent || `Part ${partIndex + 1}`
      
      // Try to get instrument from score-instrument
      const instrumentEl = doc.querySelector(`score-part[id="${partId}"] score-instrument instrument-name`)
      const instrument = instrumentEl?.textContent || 'Unknown'
      
      measures.forEach((measure) => {
        const notes = measure.querySelectorAll('note')
        
        notes.forEach((note) => {
          const pitchElem = note.querySelector('pitch')
          const durationElem = note.querySelector('duration')
          
          if (!pitchElem || !durationElem) return
          
          const step = pitchElem.querySelector('step')?.textContent || 'C'
          const octave = parseInt(pitchElem.querySelector('octave')?.textContent || '4')
          const alter = parseInt(pitchElem.querySelector('alter')?.textContent || '0')
          const duration = parseInt(durationElem.textContent || '4')
          
          const noteType = note.querySelector('type')?.textContent || 'quarter'
          const durationBeats = (duration / 4) * (NOTE_DURATION_MAP[noteType] || 1)
          const durationMs = durationBeats * beatDuration
          
          const midi = stepToMidi(step, octave, alter)
          
          // Get finger and string info
          const finger = note.querySelector('finger')?.textContent
          const string = note.querySelector('string')?.textContent
          
          // Get dynamics
          const dynamicElem = note.querySelector('dynamics')
          const dynamic = dynamicElem ? Array.from(dynamicElem.children).map(c => c.tagName).join(', ') : undefined
          
          // Get articulations
          const articulations: string[] = []
          note.querySelectorAll('articulation').forEach(art => {
            articulations.push(art.tagName)
          })
          
          partNotes.push({
            pitch: `${step}${octave}`,
            midi,
            startMs: Math.round(currentBeat * beatDuration),
            durationMs: Math.round(durationMs),
            lane: midi % 4,
            track: partIndex,
            instrument: instrument.toLowerCase(),
            string,
            dynamic,
            articulations: articulations.length > 0 ? articulations : undefined
          })
          
          currentBeat += durationBeats
        })
      })
      
      parts.push({
        id: partId,
        name: partName,
        instrument: instrument.toLowerCase(),
        notes: partNotes
      })
    })
    
    return {
      title,
      composer,
      tempo,
      timeSignature: { beats, beatType },
      parts
    }
  } catch (error) {
    console.error('MusicXML parsing error:', error)
    return null
  }
}

// Convert parsed song to flat notes array
export function getAllNotes(song: ParsedSong, trackFilter?: number): ParsedNote[] {
  const notes: ParsedNote[] = []
  
  song.parts.forEach((part, index) => {
    if (trackFilter !== undefined && index !== trackFilter) return
    
    part.notes.forEach(note => {
      notes.push({ ...note, track: index })
    })
  })
  
  // Sort by start time
  notes.sort((a, b) => a.startMs - b.startMs)
  
  return notes
}