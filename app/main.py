import pygame
import sys
import os
import time
import json

from app.config import SCREEN_WIDTH, SCREEN_HEIGHT, FPS, NOTE_TRAVEL_TIME
from app.core.musicxml_parser import MusicXMLParser, create_sample_song
from app.core.audio_engine import AudioEngine
from app.core.note_engine import NoteEngine
from app.core.scoring import ScoringSystem
from app.core.input_handler import GameInputHandler, InputHandler
from app.instruments.instrument_manager import InstrumentManager
from app.ui.highway_renderer import HighwayRenderer
from app.ui.menu import (
    MainMenu, SongSelectionMenu, DifficultyMenu,
    ResultsScreen, SettingsMenu, CountdownScreen
)

class GameState:
    MENU = "menu"
    SONG_SELECT = "song_select"
    DIFFICULTY_SELECT = "difficulty_select"
    COUNTDOWN = "countdown"
    PLAYING = "playing"
    RESULTS = "results"
    SETTINGS = "settings"

class OrchestraHeroGame:
    def __init__(self):
        pygame.init()
        pygame.display.set_caption("Orchestra Hero")
        self.screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
        self.clock = pygame.time.Clock()
        
        self.state = GameState.MENU
        
        self.audio_engine = None
        self.parser = None
        self.note_engine = None
        self.highway = None
        self.scoring = None
        self.input_handler = None
        
        self.main_menu = MainMenu(self.screen)
        self.song_menu = SongSelectionMenu(self.screen)
        self.difficulty_menu = DifficultyMenu(self.screen)
        self.results_screen = ResultsScreen(self.screen)
        self.settings_menu = SettingsMenu(self.screen)
        self.countdown = CountdownScreen(self.screen)
        
        self.current_song = None
        self.current_difficulty = "beginner"
        self.game_start_time = 0
        self.countdown_start = 0
        self.show_fingering = True
        
        self.songs_folder = self._get_songs_folder()
        
        self.running = True
    
    def _get_songs_folder(self):
        if hasattr(sys, '_MEIPASS'):
            base_path = os.path.dirname(sys._MEIPASS)
        else:
            base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        
        return os.path.join(base_path, "songs")
    
    def initialize_audio(self):
        if self.audio_engine is None:
            self.audio_engine = AudioEngine()
            self.audio_engine.initialize()
    
    def load_song(self, song_data):
        musicxml_path = song_data.get("musicxml")
        audio_path = song_data.get("audio")
        
        if not os.path.exists(musicxml_path):
            print(f"MusicXML not found: {musicxml_path}")
            return False
        
        self.parser = MusicXMLParser(musicxml_path)
        if not self.parser.parse():
            print("Failed to parse MusicXML")
            return False
        
        self.initialize_audio()
        
        if audio_path and os.path.exists(audio_path):
            self.audio_engine.load_song(audio_path)
        
        difficulty_tempo = {
            "beginner": 0.5,
            "intermediate": 0.75,
            "advanced": 1.0,
            "expert": 1.1
        }
        
        tempo_mult = difficulty_tempo.get(self.current_difficulty, 1.0)
        tempo = self.parser.tempo * tempo_mult
        
        notes = self.parser.get_all_notes()
        
        beat_duration_ms = 60000 / tempo
        for note in notes:
            if "duration_beats" in note:
                note["start_ms"] = int(note["beat"] * beat_duration_ms)
                note["lane"] = note.get("midi", 60) % 4
        
        self.note_engine = NoteEngine(notes, tempo)
        self.note_engine.set_travel_time(NOTE_TRAVEL_TIME)
        
        self.highway = HighwayRenderer(self.screen)
        self.highway.set_notes(notes)
        self.highway.show_fingering = self.show_fingering
        
        self.scoring = ScoringSystem()
        self.scoring.set_total_notes(len(notes))
        
        self.input_handler = GameInputHandler(self.highway, self.scoring, self.note_engine)
        
        self.current_song = song_data
        
        return True
    
    def handle_menu_input(self):
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                self.running = False
                return "quit"
            
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE:
                    if self.state == GameState.MENU:
                        self.running = False
                        return "quit"
                    elif self.state in [GameState.SONG_SELECT, GameState.DIFFICULTY_SELECT, GameState.SETTINGS]:
                        self.state = GameState.MENU
            
            if self.state == GameState.MENU:
                result = self.main_menu.handle_input(event)
                if result == "Play":
                    self.song_menu.load_songs(self.songs_folder)
                    self.state = GameState.SONG_SELECT
                elif result == "Settings":
                    self.state = GameState.SETTINGS
                elif result == "Exit":
                    self.running = False
                    return "quit"
            
            elif self.state == GameState.SONG_SELECT:
                result = self.song_menu.handle_input(event)
                if result == "back":
                    self.state = GameState.MENU
                elif result and isinstance(result, dict):
                    self.current_song = result
                    self.state = GameState.DIFFICULTY_SELECT
            
            elif self.state == GameState.DIFFICULTY_SELECT:
                result = self.difficulty_menu.handle_input(event)
                if result == "back":
                    self.state = GameState.SONG_SELECT
                elif result and isinstance(result, str):
                    self.current_difficulty = result
                    if self.load_song(self.current_song):
                        self.state = GameState.COUNTDOWN
                        self.countdown_start = time.time()
            
            elif self.state == GameState.SETTINGS:
                result = self.settings_menu.handle_input(event)
                if result == "back":
                    self.state = GameState.MENU
                elif result == "fingering":
                    self.show_fingering = not self.settings_menu.values["fingering"]
            
            elif self.state == GameState.RESULTS:
                result = self.results_screen.handle_input(event)
                if result == "continue":
                    self.state = GameState.MENU
        
        return None
    
    def update_playing(self, dt):
        current_time = time.time() * 1000 - self.game_start_time
        
        self.input_handler.update_time(current_time)
        
        missed = self.input_handler.check_misses()
        
        remaining_notes = self.note_engine.get_pending_notes()
        
        if not self.audio_engine.is_playing() and current_time > 5000:
            all_played = True
            for note in self.note_engine.notes:
                if not note.get("processed", False):
                    if note.get("start_ms", 0) + note.get("duration_ms", 0) > current_time:
                        all_played = False
                        break
            
            if all_played or current_time > 60000:
                results = self.scoring.get_results()
                self.results_screen.set_results(results)
                self.state = GameState.RESULTS
                return
        
        self.highway.render(current_time)
    
    def render_menu(self):
        if self.state == GameState.MENU:
            self.main_menu.render()
        elif self.state == GameState.SONG_SELECT:
            self.song_menu.render()
        elif self.state == GameState.DIFFICULTY_SELECT:
            self.difficulty_menu.render()
        elif self.state == GameState.SETTINGS:
            self.settings_menu.render()
    
    def run(self):
        while self.running:
            dt = self.clock.tick(FPS) / 1000.0
            
            if self.state == GameState.COUNTDOWN:
                for event in pygame.event.get():
                    if event.type == pygame.QUIT:
                        self.running = False
                    if event.type == pygame.KEYDOWN and event.key == pygame.K_ESCAPE:
                        self.state = GameState.MENU
                
                elapsed = time.time() - self.countdown_start
                if elapsed >= 3:
                    self.game_start_time = time.time() * 1000
                    if self.audio_engine.current_song:
                        self.audio_engine.play()
                    self.state = GameState.PLAYING
                else:
                    self.countdown.update(dt)
                    self.countdown.render()
                    pygame.display.flip()
                    continue
            
            elif self.state == GameState.PLAYING:
                for event in pygame.event.get():
                    if event.type == pygame.QUIT:
                        self.running = False
                    if event.type == pygame.KEYDOWN:
                        if event.key == pygame.K_ESCAPE:
                            self.state = GameState.MENU
                            if self.audio_engine:
                                self.audio_engine.stop()
                        else:
                            self.input_handler.handle_key_down(event.key)
                    elif event.type == pygame.KEYUP:
                        self.input_handler.handle_key_up(event.key)
                
                self.update_playing(dt)
            
            else:
                result = self.handle_menu_input()
                if result == "quit":
                    break
                self.render_menu()
            
            pygame.display.flip()
        
        if self.audio_engine:
            self.audio_engine.stop()
        
        pygame.quit()
        sys.exit()

def create_default_song():
    song_path = os.path.join(os.path.dirname(__file__), "..", "songs", "ode_to_joy")
    os.makedirs(song_path, exist_ok=True)
    
    create_sample_song()
    print(f"Created sample song at {song_path}")

def main():
    create_default_song()
    
    game = OrchestraHeroGame()
    game.run()

if __name__ == "__main__":
    main()