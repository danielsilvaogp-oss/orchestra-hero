import pygame
import os
import time

class AudioEngine:
    def __init__(self):
        self.initialized = False
        self.music_channel = None
        self.sound_effects = {}
        self.current_song = None
        self.song_start_time = 0
        self.paused = False
        self.pause_time = 0
        self.total_paused_time = 0
        
    def initialize(self):
        if self.initialized:
            return
        
        try:
            pygame.mixer.init(frequency=44100, size=-16, channels=2, buffer=512)
            self.music_channel = pygame.mixer.Channel(0)
            self.initialized = True
            print("Audio engine initialized")
        except Exception as e:
            print(f"Failed to initialize audio: {e}")
            self.initialized = False
    
    def load_song(self, song_path):
        if not self.initialized:
            self.initialize()
        
        if not os.path.exists(song_path):
            print(f"Song file not found: {song_path}")
            return False
        
        try:
            pygame.mixer.music.load(song_path)
            self.current_song = song_path
            return True
        except Exception as e:
            print(f"Failed to load song: {e}")
            return False
    
    def play(self, start_ms=0):
        if not self.current_song:
            return False
        
        try:
            if start_ms > 0:
                pygame.mixer.music.play(start=start_ms / 1000.0)
            else:
                pygame.mixer.music.play()
            
            self.song_start_time = time.time() * 1000
            self.paused = False
            self.total_paused_time = 0
            return True
        except Exception as e:
            print(f"Failed to play: {e}")
            return False
    
    def stop(self):
        try:
            pygame.mixer.music.stop()
            self.current_song = None
        except Exception as e:
            print(f"Failed to stop: {e}")
    
    def pause(self):
        if not self.paused:
            pygame.mixer.music.pause()
            self.pause_time = time.time() * 1000
            self.paused = True
    
    def resume(self):
        if self.paused:
            pygame.mixer.music.unpause()
            self.total_paused_time += time.time() * 1000 - self.pause_time
            self.paused = False
    
    def get_current_time(self):
        if not self.current_song:
            return 0
        
        if self.paused:
            return self.pause_time - self.song_start_time - self.total_paused_time
        
        current = time.time() * 1000
        return current - self.song_start_time - self.total_paused_time
    
    def is_playing(self):
        return pygame.mixer.music.get_busy()
    
    def set_volume(self, volume):
        pygame.mixer.music.set_volume(max(0.0, min(1.0, volume)))
    
    def load_sound(self, name, path):
        if not self.initialized:
            self.initialize()
        
        if os.path.exists(path):
            try:
                self.sound_effects[name] = pygame.mixer.Sound(path)
                return True
            except Exception as e:
                print(f"Failed to load sound {name}: {e}")
        return False
    
    def play_sound(self, name):
        if name in self.sound_effects:
            channel = pygame.mixer.find_channel()
            if channel:
                channel.play(self.sound_effects[name])
    
    def get_duration(self):
        return pygame.mixer.music.get_length() * 1000

class Metronome:
    def __init__(self, bpm=120):
        self.bpm = bpm
        self.interval_ms = 60000 / bpm
        self.enabled = False
        self.last_beat_time = 0
        self.beat_count = 0
        self.sound = None
        
    def set_bpm(self, bpm):
        self.bpm = bpm
        self.interval_ms = 60000 / bpm
    
    def update(self, current_time):
        if not self.enabled:
            return None
        
        if current_time - self.last_beat_time >= self.interval_ms:
            self.last_beat_time = current_time
            self.beat_count += 1
            return self.beat_count % 4
        
        return None
    
    def set_sound(self, sound):
        self.sound = sound
    
    def play_beat(self):
        if self.sound:
            channel = pygame.mixer.find_channel()
            if channel:
                channel.play(self.sound)

class AudioSync:
    def __init__(self, audio_engine):
        self.audio = audio_engine
        self.offset = 0
        self.preload_time = 2000
        
    def calculate_note_start(self, note_start_ms):
        return note_start_ms + self.offset
    
    def is_note_visible(self, note_start_ms, current_time, travel_time):
        visible_start = note_start_ms - travel_time
        return visible_start <= current_time <= note_start_ms + 200
    
    def get_visible_notes(self, notes, current_time, travel_time):
        visible = []
        for note in notes:
            if self.is_note_visible(note["start_ms"], current_time, travel_time):
                visible.append(note)
        return visible
    
    def sync_to_audio(self):
        pass

def create_metronome_click():
    try:
        import numpy as np
        import wave
        import tempfile
        
        sample_rate = 44100
        duration = 0.05
        frequency = 1000
        
        t = np.linspace(0, duration, int(sample_rate * duration))
        audio = np.sin(2 * np.pi * frequency * t) * 0.5
        audio = (audio * 32767).astype(np.int16)
        
        audio = np.column_stack((audio, audio))
        
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as f:
            temp_path = f.name
        
        with wave.open(temp_path, 'w') as wav_file:
            wav_file.setnchannels(2)
            wav_file.setsampwidth(2)
            wav_file.setframerate(sample_rate)
            wav_file.writeframes(audio.tobytes())
        
        return temp_path
    except:
        return None

if __name__ == "__main__":
    engine = AudioEngine()
    engine.initialize()
    print("Audio engine test complete")