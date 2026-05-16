import json
import os

SCREEN_WIDTH = 1280
SCREEN_HEIGHT = 720
FPS = 60

HIGHWAY_WIDTH = 800
HIGHWAY_LANES = 4
HIGHWAY_TOP_MARGIN = 100
HIT_ZONE_Y = 580

NOTE_TRAVEL_TIME = 2000

TIMING_WINDOWS = {
    "perfect": 30,
    "great": 60,
    "good": 100,
    "ok": 150,
    "miss": 200
}

POINTS = {
    "perfect": 100,
    "great": 75,
    "good": 50,
    "ok": 25,
    "miss": 0
}

DEFAULT_KEY_BINDINGS = {
    "lane_0": "a",
    "lane_1": "s",
    "lane_2": "d",
    "lane_3": "f"
}

COLORS = {
    "background": (10, 10, 26),
    "highway": (20, 20, 40),
    "lane_divider": (60, 60, 80),
    "hit_zone": (80, 80, 120),
    "hit_zone_active": (120, 180, 255),
    "note_natural": (255, 255, 255),
    "note_sharp": (100, 150, 255),
    "note_accent": (255, 215, 0),
    "hit_perfect": (255, 215, 0),
    "hit_great": (0, 255, 100),
    "hit_good": (100, 150, 255),
    "hit_miss": (255, 50, 50),
    "text_primary": (255, 255, 255),
    "text_gold": (212, 175, 55),
    "text_dark": (50, 50, 70)
}

INSTRUMENT_COLORS = {
    "violin": (140, 0, 140),
    "viola": (200, 100, 50),
    "cello": (100, 60, 30),
    "double_bass": (50, 30, 20),
    "flute": (200, 200, 255),
    "oboe": (180, 140, 80),
    "clarinet": (255, 200, 100),
    "bassoon": (100, 60, 30),
    "french_horn": (255, 180, 50),
    "trumpet": (255, 150, 50),
    "trombone": (200, 150, 80),
    "tuba": (80, 60, 50),
    "timpani": (150, 100, 50),
    "snare_drum": (200, 180, 150),
    "piano": (50, 50, 60),
    "harp": (150, 180, 200)
}

DIFFICULTY_SETTINGS = {
    "beginner": {"tempo_multiplier": 0.5, "show_fingering": True, "simplify_accidentals": True},
    "intermediate": {"tempo_multiplier": 0.75, "show_fingering": True, "simplify_accidentals": False},
    "advanced": {"tempo_multiplier": 1.0, "show_fingering": True, "simplify_accidentals": False},
    "expert": {"tempo_multiplier": 1.1, "show_fingering": False, "simplify_accidentals": False}
}

def load_settings():
    settings_path = os.path.join(os.path.dirname(__file__), "..", "settings.json")
    if os.path.exists(settings_path):
        with open(settings_path, "r") as f:
            return json.load(f)
    return {}

def save_settings(settings):
    settings_path = os.path.join(os.path.dirname(__file__), "..", "settings.json")
    with open(settings_path, "w") as f:
        json.dump(settings, f, indent=2)