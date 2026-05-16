import pygame
from app.config import DEFAULT_KEY_BINDINGS, HIGHWAY_LANES

class InputHandler:
    def __init__(self):
        self.key_to_lane = self._create_key_mapping()
        self.lane_keys_pressed = [False] * HIGHWAY_LANES
        self.key_handlers = []
        self.mouse_handlers = []
        
    def _create_key_mapping(self):
        mapping = {}
        key_names = ["a", "s", "d", "f"]
        
        for i, key_name in enumerate(key_names):
            mapping[pygame.key.key_code(key_name)] = i
        
        mapping[pygame.K_1] = 0
        mapping[pygame.K_2] = 1
        mapping[pygame.K_3] = 2
        mapping[pygame.K_4] = 3
        
        return mapping
    
    def update(self):
        self.lane_keys_pressed = [False] * HIGHWAY_LANES
        
    def handle_key_down(self, key):
        if key in self.key_to_lane:
            lane = self.key_to_lane[key]
            self.lane_keys_pressed[lane] = True
            
            for handler in self.key_handlers:
                handler.on_key_down(lane)
            
            return lane
        
        return None
    
    def handle_key_up(self, key):
        if key in self.key_to_lane:
            lane = self.key_to_lane[key]
            self.lane_keys_pressed[lane] = False
            
            for handler in self.key_handlers:
                handler.on_key_up(lane)
            
            return lane
        
        return None
    
    def is_lane_pressed(self, lane):
        if 0 <= lane < HIGHWAY_LANES:
            return self.lane_keys_pressed[lane]
        return False
    
    def get_pressed_lanes(self):
        return [i for i, pressed in enumerate(self.lane_keys_pressed) if pressed]
    
    def add_key_handler(self, handler):
        self.key_handlers.append(handler)
    
    def remove_key_handler(self, handler):
        if handler in self.key_handlers:
            self.key_handlers.remove(handler)
    
    def get_key_name_for_lane(self, lane):
        if 0 <= lane < HIGHWAY_LANES:
            key_names = ["A", "S", "D", "F"]
            return key_names[lane]
        return None

class InputHandlerWithMouse:
    def __init__(self):
        self.input_handler = InputHandler()
        self.mouse_enabled = True
        
    def handle_event(self, event):
        if event.type == pygame.KEYDOWN:
            return self.input_handler.handle_key_down(event.key)
        elif event.type == pygame.KEYUP:
            return self.input_handler.handle_key_up(event.key)
        elif event.type == pygame.MOUSEBUTTONDOWN and self.mouse_enabled:
            return self._handle_mouse_click(event.pos)
        
        return None
    
    def _handle_mouse_click(self, pos):
        from app.config import HIGHWAY_WIDTH, SCREEN_WIDTH
        
        highway_left = (SCREEN_WIDTH - HIGHWAY_WIDTH) // 2
        lane_width = HIGHWAY_WIDTH // HIGHWAY_LANES
        
        if highway_left <= pos[0] <= highway_left + HIGHWAY_WIDTH:
            lane = (pos[0] - highway_left) // lane_width
            return lane
        
        return None
    
    def is_lane_pressed(self, lane):
        return self.input_handler.is_lane_pressed(lane)
    
    def get_pressed_lanes(self):
        return self.input_handler.get_pressed_lanes()
    
    def add_key_handler(self, handler):
        self.input_handler.add_key_handler(handler)

class KeyHandler:
    def on_key_down(self, lane):
        pass
    
    def on_key_up(self, lane):
        pass

class GameInputHandler(KeyHandler):
    def __init__(self, highway_renderer, scoring, note_engine):
        self.highway = highway_renderer
        self.scoring = scoring
        self.note_engine = note_engine
        self.current_time = 0
        self.last_hit_notes = set()
    
    def update_time(self, current_time_ms):
        self.current_time = current_time_ms
    
    def on_key_down(self, lane):
        self.highway.set_key_pressed(lane, True)
        
        note, time_diff = self.highway.check_hit(lane, self.current_time)
        
        if note:
            timing = self._get_timing_from_diff(time_diff)
            self.scoring.add_hit(timing)
            self.highway.add_feedback(timing, lane)
            self.last_hit_notes.add(note)
        else:
            pass
    
    def on_key_up(self, lane):
        self.highway.set_key_pressed(lane, False)
    
    def _get_timing_from_diff(self, time_diff_ms):
        if time_diff_ms <= 30:
            return "perfect"
        elif time_diff_ms <= 60:
            return "great"
        elif time_diff_ms <= 100:
            return "good"
        elif time_diff_ms <= 150:
            return "ok"
        else:
            return "miss"
    
    def check_misses(self):
        missed_notes = []
        
        for note in self.highway.get_unprocessed_notes():
            if note.start_ms < self.current_time - 200:
                note.processed = True
                missed_notes.append(note)
                self.scoring.add_hit("miss")
                self.highway.add_feedback("miss", note.lane)
        
        return missed_notes

class SettingsInputHandler:
    def __init__(self, settings_menu):
        self.settings = settings_menu
        self.selected_item = 0
        self.items = []
    
    def set_items(self, items):
        self.items = items
    
    def move_selection(self, direction):
        if direction == "up":
            self.selected_item = (self.selected_item - 1) % len(self.items)
        elif direction == "down":
            self.selected_item = (self.selected_item + 1) % len(self.items)
    
    def select_current(self):
        if 0 <= self.selected_item < len(self.items):
            return self.items[self.selected_item]
        return None

def get_key_display_name(key_code):
    key_names = {
        pygame.K_a: "A",
        pygame.K_s: "S",
        pygame.K_d: "D",
        pygame.K_f: "F",
        pygame.K_j: "J",
        pygame.K_k: "K",
        pygame.K_l: "L",
        pygame.K_SEMICOLON: ";",
    }
    return key_names.get(key_code, f"K{key_code}")

if __name__ == "__main__":
    handler = InputHandler()
    print(f"Key mapping created with {len(handler.key_to_lane)} keys")
    print(f"Lane 0 key: {handler.get_key_name_for_lane(0)}")