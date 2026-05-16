import pygame
import math
from app.config import (
    SCREEN_WIDTH, SCREEN_HEIGHT, COLORS, HIGHWAY_WIDTH,
    HIGHWAY_LANES, HIGHWAY_TOP_MARGIN, HIT_ZONE_Y, NOTE_TRAVEL_TIME
)
from app.instruments.instrument_manager import get_instrument_color

class Note:
    def __init__(self, pitch, midi, start_ms, duration_ms, track=0, instrument="Unknown", lane=0, **kwargs):
        self.pitch = pitch
        self.midi = midi
        self.start_ms = start_ms
        self.duration_ms = duration_ms
        self.track = track
        self.instrument = instrument
        self.lane = lane
        self.fingering = kwargs.get("fingering", "")
        self.string = kwargs.get("string", 1)
        self.dynamic = kwargs.get("dynamic", "mf")
        self.articulations = kwargs.get("articulations", [])
        self.hit = False
        self.processed = False
    
    def get_color(self):
        if "#" in self.pitch or "b" in self.pitch:
            return COLORS["note_sharp"]
        
        if "accent" in self.articulations or "sfz" in self.dynamic:
            return COLORS["note_accent"]
        
        return COLORS["note_natural"]
    
    def copy(self):
        new_note = Note(
            pitch=self.pitch,
            midi=self.midi,
            start_ms=self.start_ms,
            duration_ms=self.duration_ms,
            track=self.track,
            instrument=self.instrument,
            lane=self.lane,
            fingering=self.fingering,
            string=self.string,
            dynamic=self.dynamic
        )
        new_note.hit = self.hit
        new_note.processed = self.processed
        return new_note

class HighwayRenderer:
    def __init__(self, screen):
        self.screen = screen
        self.highway_rect = pygame.Rect(
            (SCREEN_WIDTH - HIGHWAY_WIDTH) // 2,
            HIGHWAY_TOP_MARGIN,
            HIGHWAY_WIDTH,
            HIT_ZONE_Y - HIGHWAY_TOP_MARGIN + 50
        )
        self.lane_width = HIGHWAY_WIDTH // HIGHWAY_LANES
        self.notes = []
        self.active_notes = []
        self.feedback = []
        self.travel_time = NOTE_TRAVEL_TIME
        self.scroll_offset = 0
        self.hit_zone_y = HIT_ZONE_Y
        self.show_fingering = True
        self.lane_colors = [
            (200, 50, 50),
            (50, 200, 50),
            (50, 50, 200),
            (200, 200, 50)
        ]
        
        self.key_pressed = [False] * HIGHWAY_LANES
        self.key_positions = self._calculate_key_positions()
        
        self.note_texture = self._create_note_texture()
        
    def _calculate_key_positions(self):
        positions = []
        for i in range(HIGHWAY_LANES):
            x = self.highway_rect.x + (i * self.lane_width) + (self.lane_width // 2)
            positions.append(x)
        return positions
    
    def _create_note_texture(self):
        note_width = self.lane_width - 10
        note_height = 30
        
        surface = pygame.Surface((note_width, note_height), pygame.SRCALPHA)
        
        pygame.draw.rect(surface, (255, 255, 255, 200), (0, 0, note_width, note_height), border_radius=5)
        
        pygame.draw.rect(surface, (255, 215, 0), (0, 0, note_width, note_height), 2, border_radius=5)
        
        return surface
    
    def set_notes(self, notes):
        self.notes = []
        for note_data in notes:
            if isinstance(note_data, Note):
                self.notes.append(note_data)
            else:
                note = Note(
                    pitch=note_data.get("pitch", "C4"),
                    midi=note_data.get("midi", 60),
                    start_ms=note_data.get("start_ms", 0),
                    duration_ms=note_data.get("duration_ms", 500),
                    track=note_data.get("track", 0),
                    instrument=note_data.get("instrument", "Unknown"),
                    lane=note_data.get("lane", 0),
                    fingering=note_data.get("fingering", ""),
                    string=note_data.get("string", 1),
                    dynamic=note_data.get("dynamic", "mf")
                )
                self.notes.append(note)
    
    def get_visible_notes(self, current_time_ms):
        visible = []
        
        for note in self.notes:
            if note.processed or note.hit:
                continue
            
            time_until_hit = note.start_ms - current_time_ms
            
            if -200 <= time_until_hit <= self.travel_time:
                note_copy = note.copy()
                visible.append(note_copy)
        
        return visible
    
    def copy(self):
        new_note = Note(
            pitch=self.pitch,
            midi=self.midi,
            start_ms=self.start_ms,
            duration_ms=self.duration_ms,
            track=self.track,
            instrument=self.instrument,
            lane=self.lane,
            fingering=self.fingering,
            string=self.string,
            dynamic=self.dynamic
        )
        new_note.hit = self.hit
        new_note.processed = self.processed
        return new_note
    
    def render(self, current_time_ms):
        self._draw_background()
        self._draw_lanes()
        self._draw_hit_zone()
        self._draw_notes(current_time_ms)
        self._draw_feedback()
    
    def _draw_background(self):
        pygame.draw.rect(self.screen, COLORS["highway"], self.highway_rect)
        
        gradient = pygame.Surface((self.highway_rect.width, self.highway_rect.height), pygame.SRCALPHA)
        for i in range(self.highway_rect.height):
            alpha = int(50 * (1 - i / self.highway_rect.height))
            pygame.draw.line(gradient, (255, 255, 255, alpha), (0, i), (self.highway_rect.width, i))
        
        self.screen.blit(gradient, (self.highway_rect.x, self.highway_rect.y))
    
    def _draw_lanes(self):
        for i in range(HIGHWAY_LANES + 1):
            x = self.highway_rect.x + (i * self.lane_width)
            pygame.draw.line(
                self.screen,
                COLORS["lane_divider"],
                (x, self.highway_rect.top),
                (x, self.hit_zone_y),
                2 if i > 0 and i < HIGHWAY_LANES else 1
            )
        
        for i in range(HIGHWAY_LANES):
            if self.key_pressed[i]:
                color = (100, 255, 100)
            else:
                color = (60, 60, 80)
            
            lane_rect = pygame.Rect(
                self.highway_rect.x + (i * self.lane_width) + 5,
                self.hit_zone_y - 20,
                self.lane_width - 10,
                40
            )
            pygame.draw.rect(self.screen, color, lane_rect, border_radius=5)
            
            key_labels = ["A", "S", "D", "F"]
            if i < len(key_labels):
                font = pygame.font.Font(None, 24)
                text = font.render(key_labels[i], True, (150, 150, 150))
                text_rect = text.get_rect(center=(lane_rect.centerx, lane_rect.centery))
                self.screen.blit(text, text_rect)
    
    def _draw_hit_zone(self):
        hit_rect = pygame.Rect(
            self.highway_rect.x,
            self.hit_zone_y - 5,
            self.highway_rect.width,
            10
        )
        
        for i in range(HIGHWAY_LANES):
            lane_x = self.highway_rect.x + (i * self.lane_width)
            pygame.draw.rect(
                self.screen,
                COLORS["hit_zone"],
                (lane_x + 2, self.hit_zone_y - 3, self.lane_width - 4, 6),
                border_radius=3
            )
        
        pygame.draw.line(
            self.screen,
            (100, 100, 150),
            (self.highway_rect.x, self.hit_zone_y),
            (self.highway_rect.right, self.hit_zone_y),
            3
        )
    
    def _draw_notes(self, current_time_ms):
        for note in self.notes:
            if note.processed or note.hit:
                continue
            
            time_until_hit = note.start_ms - current_time_ms
            
            if time_until_hit > self.travel_time or time_until_hit < -300:
                continue
            
            progress = 1.0 - (time_until_hit / self.travel_time)
            progress = max(0.0, min(1.0, progress))
            
            y = self.highway_rect.top + (progress * (self.hit_zone_y - self.highway_rect.top - 40))
            
            lane = note.lane % HIGHWAY_LANES
            x = self.highway_rect.x + (lane * self.lane_width) + (self.lane_width // 2)
            
            note_width = self.lane_width - 15
            note_height = 35
            
            note_rect = pygame.Rect(
                x - note_width // 2,
                y,
                note_width,
                note_height
            )
            
            note_color = note.get_color()
            
            instrument_color = get_instrument_color(note.instrument)
            
            pygame.draw.rect(self.screen, instrument_color, note_rect, border_radius=8)
            
            pygame.draw.rect(self.screen, (255, 255, 255), note_rect, 2, border_radius=8)
            
            font = pygame.font.Font(None, 20)
            text = font.render(note.pitch, True, (255, 255, 255))
            text_rect = text.get_rect(center=note_rect.center)
            self.screen.blit(text, text_rect)
            
            if self.show_fingering and note.fingering:
                fing_font = pygame.font.Font(None, 16)
                fing_text = fing_font.render(f"({note.fingering})", True, (200, 200, 200))
                self.screen.blit(fing_text, (note_rect.centerx - 10, note_rect.bottom + 2))
    
    def _draw_feedback(self):
        self.feedback = [f for f in self.feedback if f.update(1/60)]
        
        for fb in self.feedback:
            alpha = fb.get_alpha()
            color = tuple(list(fb.color) + [alpha])
            
            font = pygame.font.Font(None, fb.size)
            text = font.render(fb.text, True, fb.color)
            text_rect = text.get_rect(center=(fb.x, fb.y - 20 + (1 - fb.lifetime) * 30))
            
            self.screen.blit(text, text_rect)
    
    def add_feedback(self, timing, lane):
        x = self.key_positions[lane % HIGHWAY_LANES]
        y = self.hit_zone_y - 30
        
        from app.core.scoring import HitFeedback
        self.feedback.append(HitFeedback(timing, None, x, y))
    
    def set_key_pressed(self, lane, pressed):
        if 0 <= lane < HIGHWAY_LANES:
            self.key_pressed[lane] = pressed
    
    def check_hit(self, lane, current_time_ms):
        for note in self.notes:
            if note.processed or note.hit:
                continue
            
            note_lane = note.lane % HIGHWAY_LANES
            if note_lane != lane:
                continue
            
            time_diff = abs(current_time_ms - note.start_ms)
            
            if time_diff <= 200:
                note.hit = True
                note.processed = True
                return note, time_diff
        
        return None, 0
    
    def mark_miss(self, note):
        note.processed = True
    
    def reset(self):
        for note in self.notes:
            note.hit = False
            note.processed = False
        self.feedback = []
    
    def get_unprocessed_notes(self):
        return [n for n in self.notes if not n.processed]

class HighwayRenderer2D(HighwayRenderer):
    def __init__(self, screen):
        super().__init__(screen)
        self.perspective = 0.3
    
    def render(self, current_time_ms):
        self._draw_background_3d()
        self._draw_lanes_3d()
        self._draw_hit_zone()
        self._draw_notes_3d(current_time_ms)
        self._draw_feedback()
    
    def _draw_background_3d(self):
        pygame.draw.rect(self.screen, COLORS["highway"], self.highway_rect)
        
        vanishing_point_x = SCREEN_WIDTH // 2
        vanishing_point_y = HIGHWAY_TOP_MARGIN - 50
        
        for i in range(HIGHWAY_LANES + 1):
            start_x = self.highway_rect.x + (i * self.lane_width)
            end_x = vanishing_point_x + (start_x - vanishing_point_x) * self.perspective
            
            pygame.draw.line(
                self.screen,
                (40, 40, 60),
                (start_x, self.highway_rect.top),
                (end_x, vanishing_point_y),
                1
            )
    
    def _draw_lanes_3d(self):
        vanishing_point_x = SCREEN_WIDTH // 2
        vanishing_point_y = HIGHWAY_TOP_MARGIN - 50
        
        for i in range(HIGHWAY_LANES + 1):
            start_x = self.highway_rect.x + (i * self.lane_width)
            end_x = vanishing_point_x + (start_x - vanishing_point_x) * self.perspective
            
            pygame.draw.line(
                self.screen,
                COLORS["lane_divider"],
                (start_x, self.highway_rect.top),
                (end_x, vanishing_point_y),
                2
            )
    
    def _draw_notes_3d(self, current_time_ms):
        for note in self.notes:
            if note.processed or note.hit:
                continue
            
            time_until_hit = note.start_ms - current_time_ms
            
            if time_until_hit > self.travel_time or time_until_hit < -300:
                continue
            
            progress = 1.0 - (time_until_hit / self.travel_time)
            progress = max(0.0, min(1.0, progress))
            
            base_y = self.highway_rect.top + (progress * (self.hit_zone_y - self.highway_rect.top - 40))
            
            scale = 0.3 + (0.7 * progress)
            
            lane = note.lane % HIGHWAY_LANES
            base_x = self.highway_rect.x + (lane * self.lane_width) + (self.lane_width // 2)
            
            vanishing_point_x = SCREEN_WIDTH // 2
            x = vanishing_point_x + (base_x - vanishing_point_x) * scale
            
            note_width = int((self.lane_width - 15) * scale)
            note_height = int(35 * scale)
            
            note_rect = pygame.Rect(
                x - note_width // 2,
                base_y,
                note_width,
                note_height
            )
            
            note_color = note.get_color()
            instrument_color = get_instrument_color(note.instrument)
            
            pygame.draw.rect(self.screen, instrument_color, note_rect, border_radius=8)
            pygame.draw.rect(self.screen, (255, 255, 255), note_rect, 2, border_radius=8)
            
            if note_height > 15:
                font = pygame.font.Font(None, max(12, int(20 * scale)))
                text = font.render(note.pitch, True, (255, 255, 255))
                text_rect = text.get_rect(center=note_rect.center)
                self.screen.blit(text, text_rect)

if __name__ == "__main__":
    pygame.init()
    screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
    highway = HighwayRenderer(screen)
    print("Highway renderer initialized")