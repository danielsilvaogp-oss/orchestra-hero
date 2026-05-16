import pygame
import os
import json
from app.config import SCREEN_WIDTH, SCREEN_HEIGHT, COLORS, DIFFICULTY_SETTINGS

class MenuRenderer:
    def __init__(self, screen):
        self.screen = screen
        self.font_title = None
        self.font_normal = None
        self.font_small = None
        self._init_fonts()
        self.background = self._create_background()
        
    def _init_fonts(self):
        pygame.font.init()
        self.font_title = pygame.font.Font(None, 72)
        self.font_normal = pygame.font.Font(None, 36)
        self.font_small = pygame.font.Font(None, 24)
        
    def _create_background(self):
        bg = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT))
        bg.fill(COLORS["background"])
        
        for i in range(0, SCREEN_HEIGHT, 4):
            alpha = int(10 + 10 * (i / SCREEN_HEIGHT))
            pygame.draw.line(bg, (20, 20, 40 + alpha), (0, i), (SCREEN_WIDTH, i))
        
        return bg
    
    def draw_background(self):
        self.screen.blit(self.background, (0, 0))
    
    def draw_title(self, text, y=100):
        title = self.font_title.render(text, True, COLORS["text_gold"])
        title_rect = title.get_rect(center=(SCREEN_WIDTH // 2, y))
        
        shadow = self.font_title.render(text, True, (50, 40, 20))
        shadow_rect = shadow.get_rect(center=(SCREEN_WIDTH // 2 + 3, y + 3))
        self.screen.blit(shadow, shadow_rect)
        
        self.screen.blit(title, title_rect)
    
    def draw_text(self, text, x, y, color=COLORS["text_primary"], size="normal"):
        font = self.font_normal if size == "normal" else self.font_small
        text_surf = font.render(text, True, color)
        text_rect = text_surf.get_rect(topleft=(x, y))
        self.screen.blit(text_surf, text_rect)
    
    def draw_centered_text(self, text, x, y, color=COLORS["text_primary"], size="normal"):
        font = self.font_normal if size == "normal" else self.font_small
        text_surf = font.render(text, True, color)
        text_rect = text_surf.get_rect(center=(x, y))
        self.screen.blit(text_surf, text_rect)

class MainMenu:
    def __init__(self, screen):
        self.screen = screen
        self.renderer = MenuRenderer(screen)
        self.options = ["Play", "Practice", "Settings", "Exit"]
        self.selected = 0
        self.state = "main"
        self.submenu = None
    
    def handle_input(self, event):
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_UP:
                self.selected = (self.selected - 1) % len(self.options)
            elif event.key == pygame.K_DOWN:
                self.selected = (self.selected + 1) % len(self.options)
            elif event.key == pygame.K_RETURN or event.key == pygame.K_SPACE:
                return self.options[self.selected]
            elif event.key == pygame.K_ESCAPE:
                return "exit"
        
        return None
    
    def render(self):
        self.renderer.draw_background()
        self.renderer.draw_title("ORCHESTRA HERO")
        
        y_start = 250
        spacing = 60
        
        for i, option in enumerate(self.options):
            if i == self.selected:
                color = COLORS["text_gold"]
                prefix = "> "
            else:
                color = COLORS["text_primary"]
                prefix = "  "
            
            self.renderer.draw_centered_text(
                prefix + option,
                SCREEN_WIDTH // 2,
                y_start + (i * spacing),
                color
            )
        
        self.renderer.draw_centered_text(
            "Use arrow keys and Enter to select",
            SCREEN_WIDTH // 2,
            SCREEN_HEIGHT - 50,
            COLORS["text_dark"],
            "small"
        )

class SongSelectionMenu:
    def __init__(self, screen):
        self.screen = screen
        self.renderer = MenuRenderer(screen)
        self.songs = []
        self.selected = 0
        self.scroll_offset = 0
        self.visible_songs = 8
    
    def load_songs(self, songs_folder):
        self.songs = []
        
        if not os.path.exists(songs_folder):
            return
        
        for song_dir in os.listdir(songs_folder):
            song_path = os.path.join(songs_folder, song_dir)
            if not os.path.isdir(song_path):
                continue
            
            metadata_path = os.path.join(song_path, "metadata.json")
            musicxml_files = [f for f in os.listdir(song_path) if f.endswith((".musicxml", ".xml"))]
            
            if not musicxml_files:
                continue
            
            if os.path.exists(metadata_path):
                with open(metadata_path, "r") as f:
                    metadata = json.load(f)
            else:
                metadata = {
                    "title": song_dir.replace("_", " ").title(),
                    "composer": "Unknown",
                    "difficulty": "beginner"
                }
            
            audio_files = [f for f in os.listdir(song_path) if f.endswith((".mp3", ".wav", ".ogg"))]
            
            self.songs.append({
                "name": song_dir,
                "title": metadata.get("title", song_dir),
                "composer": metadata.get("composer", "Unknown"),
                "difficulty": metadata.get("difficulty", "beginner"),
                "path": song_path,
                "musicxml": os.path.join(song_path, musicxml_files[0]),
                "audio": os.path.join(song_path, audio_files[0]) if audio_files else None,
                "tempo": metadata.get("tempo", 120)
            })
    
    def handle_input(self, event):
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_UP:
                self.selected = max(0, self.selected - 1)
            elif event.key == pygame.K_DOWN:
                self.selected = min(len(self.songs) - 1, self.selected + 1)
            elif event.key == pygame.K_PAGEUP:
                self.selected = max(0, self.selected - self.visible_songs)
            elif event.key == pygame.K_PAGEDOWN:
                self.selected = min(len(self.songs) - 1, self.selected + self.visible_songs)
            elif event.key == pygame.K_RETURN:
                if 0 <= self.selected < len(self.songs):
                    return self.songs[self.selected]
            elif event.key == pygame.K_ESCAPE:
                return "back"
        
        return None
    
    def render(self):
        self.renderer.draw_background()
        self.renderer.draw_title("SELECT SONG")
        
        if not self.songs:
            self.renderer.draw_centered_text(
                "No songs found",
                SCREEN_WIDTH // 2,
                300,
                COLORS["text_dark"]
            )
            self.renderer.draw_centered_text(
                "Add MusicXML files to the songs folder",
                SCREEN_WIDTH // 2,
                340,
                COLORS["text_dark"],
                "small"
            )
            return
        
        y_start = 150
        item_height = 60
        
        for i in range(self.visible_songs):
            idx = self.selected - (self.visible_songs // 2) + i
            if 0 <= idx < len(self.songs):
                song = self.songs[idx]
                
                if idx == self.selected:
                    color = COLORS["text_gold"]
                else:
                    color = COLORS["text_primary"]
                
                title = f"{song['title']} - {song['composer']}"
                self.renderer.draw_centered_text(
                    title[:50],
                    SCREEN_WIDTH // 2,
                    y_start + (i * item_height),
                    color
                )
                
                diff = song.get("difficulty", "beginner")
                diff_color = {
                    "beginner": (100, 255, 100),
                    "intermediate": (255, 255, 100),
                    "advanced": (255, 150, 50),
                    "expert": (255, 50, 50)
                }.get(diff, (150, 150, 150))
                
                self.renderer.draw_centered_text(
                    f"[{diff.upper()}]",
                    SCREEN_WIDTH // 2,
                    y_start + (i * item_height) + 25,
                    diff_color,
                    "small"
                )
        
        self.renderer.draw_centered_text(
            f"{self.selected + 1} / {len(self.songs)}",
            SCREEN_WIDTH // 2,
            SCREEN_HEIGHT - 80,
            COLORS["text_dark"],
            "small"
        )
        
        self.renderer.draw_centered_text(
            "Press ENTER to select, ESC to go back",
            SCREEN_WIDTH // 2,
            SCREEN_HEIGHT - 40,
            COLORS["text_dark"],
            "small"
        )

class DifficultyMenu:
    def __init__(self, screen):
        self.screen = screen
        self.renderer = MenuRenderer(screen)
        self.difficulties = ["beginner", "intermediate", "advanced", "expert"]
        self.selected = 0
    
    def handle_input(self, event):
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_UP:
                self.selected = (self.selected - 1) % len(self.difficulties)
            elif event.key == pygame.K_DOWN:
                self.selected = (self.selected + 1) % len(self.difficulties)
            elif event.key == pygame.K_RETURN:
                return self.difficulties[self.selected]
            elif event.key == pygame.K_ESCAPE:
                return "back"
        
        return None
    
    def render(self):
        self.renderer.draw_background()
        self.renderer.draw_title("SELECT DIFFICULTY")
        
        y_start = 250
        spacing = 70
        
        for i, diff in enumerate(self.difficulties):
            if i == self.selected:
                color = COLORS["text_gold"]
                prefix = "> "
            else:
                color = COLORS["text_primary"]
                prefix = "  "
            
            diff_name = diff.upper()
            diff_color = {
                "beginner": (100, 255, 100),
                "intermediate": (255, 255, 100),
                "advanced": (255, 150, 50),
                "expert": (255, 50, 50)
            }.get(diff, (150, 150, 150))
            
            self.renderer.draw_centered_text(
                prefix + diff_name,
                SCREEN_WIDTH // 2,
                y_start + (i * spacing),
                diff_color
            )
            
            settings = DIFFICULTY_SETTINGS.get(diff, {})
            tempo_mult = settings.get("tempo_multiplier", 1.0)
            
            self.renderer.draw_centered_text(
                f"    Tempo: {int(tempo_mult * 100)}%",
                SCREEN_WIDTH // 2,
                y_start + (i * spacing) + 30,
                COLORS["text_dark"],
                "small"
            )

class ResultsScreen:
    def __init__(self, screen):
        self.screen = screen
        self.renderer = MenuRenderer(screen)
        self.results = {}
        self.animation_progress = 0
        self.show_details = False
    
    def set_results(self, results):
        self.results = results
        self.animation_progress = 0
        self.show_details = False
    
    def handle_input(self, event):
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_SPACE:
                self.show_details = not self.show_details
            elif event.key == pygame.K_RETURN or event.key == pygame.K_ESCAPE:
                return "continue"
        
        return None
    
    def render(self):
        self.renderer.draw_background()
        
        grade = self.results.get("grade", "F")
        grade_colors = {
            "S": (255, 215, 0),
            "A": (0, 255, 100),
            "B": (100, 200, 255),
            "C": (200, 200, 200),
            "D": (255, 150, 100),
            "F": (255, 50, 50)
        }
        
        grade_color = grade_colors.get(grade, (150, 150, 150))
        
        grade_font = pygame.font.Font(None, 150)
        grade_surf = grade_font.render(grade, True, grade_color)
        grade_rect = grade_surf.get_rect(center=(SCREEN_WIDTH // 2, 150))
        
        shadow = pygame.font.Font(None, 150).render(grade, True, (50, 40, 20))
        shadow_rect = shadow.get_rect(center=(SCREEN_WIDTH // 2 + 5, 155))
        self.screen.blit(shadow, shadow_rect)
        
        self.screen.blit(grade_surf, grade_rect)
        
        accuracy = self.results.get("accuracy", 0)
        self.renderer.draw_centered_text(
            f"Accuracy: {accuracy:.1f}%",
            SCREEN_WIDTH // 2,
            250,
            COLORS["text_gold"]
        )
        
        score = self.results.get("score", 0)
        self.renderer.draw_centered_text(
            f"Score: {score:,}",
            SCREEN_WIDTH // 2,
            300,
            COLORS["text_primary"]
        )
        
        max_combo = self.results.get("max_combo", 0)
        self.renderer.draw_centered_text(
            f"Max Combo: {max_combo}",
            SCREEN_WIDTH // 2,
            350,
            COLORS["text_primary"]
        )
        
        if self.show_details:
            hits = self.results.get("hits", {})
            y = 420
            
            for timing, count in [("Perfect", hits.get("perfect", 0)),
                                  ("Great", hits.get("great", 0)),
                                  ("Good", hits.get("good", 0)),
                                  ("OK", hits.get("ok", 0)),
                                  ("Miss", hits.get("miss", 0))]:
                color = COLORS.get(f"hit_{timing.lower()}", (150, 150, 150))
                self.renderer.draw_centered_text(
                    f"{timing}: {count}",
                    SCREEN_WIDTH // 2,
                    y,
                    color,
                    "small"
                )
                y += 25
        
        self.renderer.draw_centered_text(
            "Press SPACE for details, ENTER to continue",
            SCREEN_WIDTH // 2,
            SCREEN_HEIGHT - 50,
            COLORS["text_dark"],
            "small"
        )

class SettingsMenu:
    def __init__(self, screen):
        self.screen = screen
        self.renderer = MenuRenderer(screen)
        self.options = [
            ("Key Bindings", "keys"),
            ("Audio Volume", "volume"),
            ("Show Fingering", "fingering"),
            ("Back", "back")
        ]
        self.selected = 0
        self.values = {
            "volume": 80,
            "fingering": True
        }
    
    def handle_input(self, event):
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_UP:
                self.selected = (self.selected - 1) % len(self.options)
            elif event.key == pygame.K_DOWN:
                self.selected = (self.selected + 1) % len(self.options)
            elif event.key == pygame.K_LEFT:
                self._change_value(-1)
            elif event.key == pygame.K_RIGHT:
                self._change_value(1)
            elif event.key == pygame.K_RETURN:
                return self.options[self.selected][1]
            elif event.key == pygame.K_ESCAPE:
                return "back"
        
        return None
    
    def _change_value(self, direction):
        key = self.options[self.selected][1]
        
        if key == "volume":
            self.values["volume"] = max(0, min(100, self.values["volume"] + direction * 10))
        elif key == "fingering":
            self.values["fingering"] = not self.values["fingering"]
    
    def render(self):
        self.renderer.draw_background()
        self.renderer.draw_title("SETTINGS")
        
        y_start = 200
        spacing = 60
        
        for i, (label, key) in enumerate(self.options):
            if i == self.selected:
                color = COLORS["text_gold"]
                prefix = "> "
            else:
                color = COLORS["text_primary"]
                prefix = "  "
            
            value_str = ""
            if key == "volume":
                value_str = f" [{self.values['volume']}%]"
            elif key == "fingering":
                value_str = f" [{'ON' if self.values['fingering'] else 'OFF'}]"
            
            self.renderer.draw_centered_text(
                prefix + label + value_str,
                SCREEN_WIDTH // 2,
                y_start + (i * spacing),
                color
            )
        
        self.renderer.draw_centered_text(
            "← → to adjust values",
            SCREEN_WIDTH // 2,
            SCREEN_HEIGHT - 50,
            COLORS["text_dark"],
            "small"
        )

class CountdownScreen:
    def __init__(self, screen):
        self.screen = screen
        self.renderer = MenuRenderer(screen)
        self.count = 3
        self.started = False
    
    def update(self, dt):
        self.count -= dt
        return self.count <= 0
    
    def render(self):
        self.renderer.draw_background()
        
        count_value = max(1, int(self.count) + 1)
        
        count_font = pygame.font.Font(None, 200)
        count_surf = count_font.render(str(count_value), True, COLORS["text_gold"])
        count_rect = count_surf.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2))
        
        shadow = pygame.font.Font(None, 200).render(str(count_value), True, (50, 40, 20))
        shadow_rect = shadow.get_rect(center=(SCREEN_WIDTH // 2 + 5, SCREEN_HEIGHT // 2 + 5))
        self.screen.blit(shadow, shadow_rect)
        
        self.screen.blit(count_surf, count_rect)
        
        self.renderer.draw_centered_text(
            "Get Ready!",
            SCREEN_WIDTH // 2,
            SCREEN_HEIGHT // 2 - 100,
            COLORS["text_primary"]
        )

if __name__ == "__main__":
    pygame.init()
    screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
    menu = MainMenu(screen)
    print("Menu system initialized")