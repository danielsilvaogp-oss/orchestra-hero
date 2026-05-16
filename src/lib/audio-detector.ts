// Audio Analyzer for Real-time Instrument Practice
// Uses Web Audio API to detect played notes

export interface DetectedNote {
  midi: number
  frequency: number
  velocity: number
  timestamp: number
}

export class AudioDetector {
  private audioContext: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private microphone: MediaStreamAudioSourceNode | null = null
  private stream: MediaStream | null = null
  private isListening: boolean = false
  private pitchBuffer: number[] = []
  private lastDetectedNote: number | null = null
  private cooldown: number = 0
  
  // Configuration
  private readonly SAMPLE_RATE = 44100
  private readonly BUFFER_SIZE = 4096
  private readonly MIN_FREQUENCY = 60  // ~B1
  private readonly MAX_FREQUENCY = 2000 // ~B6
  private readonly COOLDOWN_MS = 200   // Time between note detections
  private readonly PITCH_CONFIDENCE = 3 // How many buffers to confirm pitch

  async init(): Promise<boolean> {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      })

      this.microphone = this.audioContext.createMediaStreamSource(this.stream)
      this.analyser = this.audioContext.createAnalyser()
      this.analyser.fftSize = 2048
      this.analyser.smoothingTimeConstant = 0.8
      
      this.microphone.connect(this.analyser)
      this.isListening = true
      
      return true
    } catch (error) {
      console.error('Failed to initialize audio detector:', error)
      return false
    }
  }

  // Detect if a note is being played
  detectNote(): DetectedNote | null {
    if (!this.isListening || !this.analyser || !this.audioContext) {
      return null
    }

    // Check cooldown
    if (this.cooldown > 0) {
      this.cooldown--
      return null
    }

    const bufferLength = this.analyser.fftSize
    const buffer = new Float32Array(bufferLength)
    this.analyser.getFloatTimeDomainData(buffer)

    // Check if there's enough signal
    let rms = 0
    for (let i = 0; i < bufferLength; i++) {
      rms += buffer[i] * buffer[i]
    }
    rms = Math.sqrt(rms / bufferLength)

    // Threshold for note detection
    if (rms < 0.01) return null

    // Detect pitch using autocorrelation
    const frequency = this.detectPitch(buffer)
    
    if (frequency < this.MIN_FREQUENCY || frequency > this.MAX_FREQUENCY) {
      return null
    }

    const midi = this.frequencyToMidi(frequency)
    
    // Add to buffer for confidence
    if (this.lastDetectedNote === midi || this.pitchBuffer.length === 0) {
      this.pitchBuffer.push(midi)
    } else {
      this.pitchBuffer = [midi]
    }

    // Need confidence level
    if (this.pitchBuffer.length < this.PITCH_CONFIDENCE) {
      return null
    }

    this.lastDetectedNote = midi
    this.cooldown = Math.floor(this.COOLDOWN_MS / (this.BUFFER_SIZE / this.SAMPLE_RATE * 1000))

    return {
      midi,
      frequency,
      velocity: Math.min(127, Math.floor(rms * 127)),
      timestamp: Date.now()
    }
  }

  private detectPitch(buffer: Float32Array): number {
    // Autocorrelation pitch detection
    const size = buffer.length
    let bestOffset = -1
    let bestCorrelation = 0
    let foundGoodCorrelation = false
    const correlations = new Array(size).fill(0)

    for (let offset = 0; offset < size; offset++) {
      let correlation = 0
      for (let i = 0; i < size - offset; i++) {
        correlation += Math.abs((buffer[i]) - (buffer[i + offset]))
      }
      correlation = 1 - (correlation / size)
      correlations[offset] = correlation
      
      if (correlation > 0.9 && correlation > bestCorrelation) {
        bestCorrelation = correlation
        bestOffset = offset
        foundGoodCorrelation = true
      } else if (foundGoodCorrelation) {
        // Find first dip
        const shift = (correlations[bestOffset + 1] - correlations[bestOffset - 1]) / 2
        const frequency = this.SAMPLE_RATE / (bestOffset + (shift * 8))
        return frequency
      }
    }

    if (bestCorrelation > 0.01) {
      return this.SAMPLE_RATE / bestOffset
    }
    return -1
  }

  private frequencyToMidi(frequency: number): number {
    return Math.round(12 * Math.log2(frequency / 440) + 69)
  }

  midiToNote(midi: number): string {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    const octave = Math.floor(midi / 12) - 1
    const note = notes[midi % 12]
    return `${note}${octave}`
  }

  stop() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop())
    }
    if (this.audioContext) {
      this.audioContext.close()
    }
    this.isListening = false
  }

  isActive(): boolean {
    return this.isListening
  }

  stopListening(): void {
    if (this.microphone) {
      this.microphone.disconnect()
      this.microphone = null
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop())
      this.stream = null
    }
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
    this.isListening = false
    this.analyser = null
  }
}

// Global singleton
let audioDetector: AudioDetector | null = null

export function getAudioDetector(): AudioDetector {
  if (!audioDetector) {
    audioDetector = new AudioDetector()
  }
  return audioDetector
}