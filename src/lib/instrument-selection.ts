// Track/Instruments detected from MusicXML

export interface SongTrack {
  id: number
  name: string
  instrument: string
  noteCount: number
  color: string
}

// Map instrument names from MusicXML to our instrument keys
const INSTRUMENT_MAPPING: Record<string, string> = {
  // Violin family
  'violin': 'violin',
  'violin i': 'violin',
  'violin ii': 'violin',
  'viola': 'viola',
  'cello': 'cello',
  'violoncello': 'cello',
  'double bass': 'double_bass',
  'contrabass': 'double_bass',
  
  // Woodwinds
  'flute': 'flute',
  'piccolo': 'flute',
  'oboe': 'oboe',
  'english horn': 'oboe',
  'clarinet': 'clarinet',
  'clarinet in bb': 'clarinet',
  'bassoon': 'bassoon',
  
  // Brass
  'french horn': 'french_horn',
  'horn': 'french_horn',
  'horn in f': 'french_horn',
  'trumpet': 'trumpet',
  'trumpet in bb': 'trumpet',
  'trombone': 'trombone',
  'tuba': 'tuba',
  
  // Percussion
  'timpani': 'timpani',
  'snare': 'snare_drum',
  'snare drum': 'snare_drum',
  'drum set': 'drum_set',
  'drums': 'drum_set',
  
  // Keyboard
  'piano': 'piano',
  'grand piano': 'piano',
  'organ': 'organ',
  'harp': 'harp',
}

export function detectInstrumentFromTrack(trackName: string): string {
  const normalized = trackName.toLowerCase().trim()
  
  for (const [key, value] of Object.entries(INSTRUMENT_MAPPING)) {
    if (normalized.includes(key)) {
      return value
    }
  }
  
  // Default based on common patterns
  if (normalized.includes('violin')) return 'violin'
  if (normalized.includes('viola')) return 'viola'
  if (normalized.includes('cello')) return 'cello'
  if (normalized.includes('flute') || normalized.includes('flauta')) return 'flute'
  if (normalized.includes('oboe')) return 'oboe'
  if (normalized.includes('clarinet')) return 'clarinet'
  if (normalized.includes('bassoon') || normalized.includes('fagot')) return 'bassoon'
  if (normalized.includes('horn') || normalized.includes('trompa')) return 'french_horn'
  if (normalized.includes('trumpet') || normalized.includes('trompeta')) return 'trumpet'
  if (normalized.includes('trombone')) return 'trombone'
  if (normalized.includes('tuba')) return 'tuba'
  if (normalized.includes('timpani')) return 'timpani'
  if (normalized.includes('piano')) return 'piano'
  if (normalized.includes('organ') || normalized.includes('órgano')) return 'organ'
  if (normalized.includes('harp') || normalized.includes('arpa')) return 'harp'
  
  return 'violin' // default
}

// Color palette for different tracks
const TRACK_COLORS = [
  '#9b30ff', // Purple
  '#cc6633', // Orange
  '#33cc66', // Green
  '#3399ff', // Blue
  '#ff6633', // Red-Orange
  '#ffcc33', // Yellow
  '#ff66cc', // Pink
  '#66ffcc', // Cyan
  '#cc66ff', // Violet
  '#ff9933', // Orange
]

export function getTrackColor(trackIndex: number): string {
  return TRACK_COLORS[trackIndex % TRACK_COLORS.length]
}

// Parse the MusicXML to extract all tracks/instruments
export async function extractTracksFromMusicXML(xmlUrl: string): Promise<SongTrack[]> {
  try {
    const response = await fetch(xmlUrl)
    const xmlText = await response.text()
    
    const parser = new DOMParser()
    const doc = parser.parseFromString(xmlText, 'text/xml')
    
    // Find all parts in the score
    const parts = doc.querySelectorAll('part')
    
    const tracks: SongTrack[] = []
    
    parts.forEach((part, index) => {
      const partId = part.getAttribute('id') || `part-${index}`
      
      // Get part name from part-list
      const partList = doc.querySelector(`score-part[id="${partId}"] part-name`)
      const partName = partList?.textContent || `Part ${index + 1}`
      
      // Try to get instrument name
      const instrumentEl = doc.querySelector(`score-part[id="${partId}"] instrument-name`)
      const instrumentName = instrumentEl?.textContent || partName
      
      // Detect instrument type
      const instrumentKey = detectInstrumentFromTrack(instrumentName)
      
      // Count notes in this part
      const notes = part.querySelectorAll('note')
      
      tracks.push({
        id: index,
        name: partName,
        instrument: instrumentKey,
        noteCount: notes.length,
        color: getTrackColor(index)
      })
    })
    
    return tracks
  } catch (error) {
    console.error('Error extracting tracks:', error)
    return []
  }
}