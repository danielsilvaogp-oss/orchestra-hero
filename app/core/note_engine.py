import time
from app.config import TIMING_WINDOWS

class NoteEngine:
    def __init__(self, notes, tempo=120):
        self.notes = notes
        self.tempo = tempo
        self.beat_duration_ms = 60000 / tempo
        self.current_note_index = 0
        self.processed_notes = set()
        self.active_notes = []
        self.travel_time = 2000
        
    def set_tempo(self, tempo):
        self.tempo = tempo
        self.beat_duration_ms = 60000 / tempo
        
        for note in self.notes:
            if "duration_beats" in note:
                note["duration_ms"] = int(self.beat_duration_ms * note["duration_beats"])
    
    def set_travel_time(self, travel_time):
        self.travel_time = travel_time
    
    def convert_beats_to_ms(self, beat):
        return int(beat * self.beat_duration_ms)
    
    def get_notes_at_time(self, current_time_ms):
        visible_notes = []
        
        for idx, note in enumerate(self.notes):
            if idx in self.processed_notes:
                continue
            
            note_start_ms = self.convert_beats_to_ms(note["beat"])
            note_end_ms = note_start_ms + note.get("duration_ms", 500)
            
            visible_start = note_start_ms - self.travel_time
            visible_end = note_start_ms + 500
            
            if visible_start <= current_time_ms <= visible_end:
                note_copy = note.copy()
                note_copy["start_ms"] = note_start_ms
                note_copy["end_ms"] = note_end_ms
                note_copy["original_index"] = idx
                note_copy["y_position"] = self.calculate_y_position(note_start_ms, current_time_ms)
                visible_notes.append(note_copy)
        
        return visible_notes
    
    def calculate_y_position(self, note_start_ms, current_time_ms):
        time_until_hit = note_start_ms - current_time_ms
        
        if time_until_hit <= 0:
            return 1.0
        
        if time_until_hit >= self.travel_time:
            return 0.0
        
        return 1.0 - (time_until_hit / self.travel_time)
    
    def check_hits(self, current_time_ms):
        hits = []
        
        for idx, note in enumerate(self.notes):
            if idx in self.processed_notes:
                continue
            
            note_start_ms = self.convert_beats_to_ms(note["beat"])
            time_diff = abs(current_time_ms - note_start_ms)
            
            if time_diff <= TIMING_WINDOWS["miss"]:
                result = self.evaluate_hit(time_diff, note, current_time_ms)
                hits.append(result)
                self.processed_notes.add(idx)
        
        return hits
    
    def evaluate_hit(self, time_diff_ms, note, current_time_ms):
        timing = "miss"
        
        if time_diff_ms <= TIMING_WINDOWS["perfect"]:
            timing = "perfect"
        elif time_diff_ms <= TIMING_WINDOWS["great"]:
            timing = "great"
        elif time_diff_ms <= TIMING_WINDOWS["good"]:
            timing = "good"
        elif time_diff_ms <= TIMING_WINDOWS["ok"]:
            timing = "ok"
        
        return {
            "timing": timing,
            "time_diff": time_diff_ms,
            "note": note,
            "current_time": current_time_ms
        }
    
    def get_pending_notes(self):
        pending = []
        for idx, note in enumerate(self.notes):
            if idx not in self.processed_notes:
                pending.append(note)
        return pending
    
    def reset(self):
        self.current_note_index = 0
        self.processed_notes = set()
        self.active_notes = []

class Note:
    def __init__(self, pitch, midi, start_ms, duration_ms, track=0, instrument="Unknown", **kwargs):
        self.pitch = pitch
        self.midi = midi
        self.start_ms = start_ms
        self.duration_ms = duration_ms
        self.track = track
        self.instrument = instrument
        self.lane = kwargs.get("lane", 0)
        self.fingering = kwargs.get("fingering", "")
        self.string = kwargs.get("string", 0)
        self.dynamic = kwargs.get("dynamic", "mf")
        self.articulations = kwargs.get("articulations", [])
        
    def to_dict(self):
        return {
            "pitch": self.pitch,
            "midi": self.midi,
            "start_ms": self.start_ms,
            "duration_ms": self.duration_ms,
            "track": self.track,
            "instrument": self.instrument,
            "lane": self.lane,
            "fingering": self.fingering,
            "string": self.string,
            "dynamic": self.dynamic,
            "articulations": self.articulations
        }

def create_notes_from_parser(parser, track_filter=None):
    notes_data = parser.get_all_notes(track_filter)
    notes = []
    
    for note_data in notes_data:
        midi = note_data.get("midi", 60)
        pitch = note_data.get("pitch", "C4")
        
        lane = pitch_to_lane(pitch, note_data.get("track", 0))
        
        note = Note(
            pitch=pitch,
            midi=midi,
            start_ms=0,
            duration_ms=note_data.get("duration_ms", 500),
            track=note_data.get("track", 0),
            instrument=note_data.get("instrument", "Unknown"),
            lane=lane,
            fingering=note_data.get("fingering", ""),
            string=note_data.get("string", 0),
            dynamic=note_data.get("dynamic", "mf"),
            articulations=note_data.get("articulations", [])
        )
        notes.append(note)
    
    return notes

def pitch_to_lane(pitch, track):
    note_names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
    
    if len(pitch) >= 2:
        note = pitch[0]
        if len(pitch) > 2 and pitch[1] == "#":
            note = pitch[:2]
        
        if note in note_names:
            note_idx = note_names.index(note)
            return (note_idx + track) % 4
    
    return track % 4

class NoteFactory:
    @staticmethod
    def from_musicxml_note(note_data, track_index=0):
        return Note(
            pitch=note_data.get("pitch", "C4"),
            midi=note_data.get("midi", 60),
            start_ms=note_data.get("start_ms", 0),
            duration_ms=note_data.get("duration_ms", 500),
            track=track_index,
            instrument=note_data.get("instrument", "Unknown"),
            lane=note_data.get("lane", 0),
            fingering=note_data.get("fingering", ""),
            dynamic=note_data.get("dynamic", "mf")
        )

if __name__ == "__main__":
    test_notes = [
        {"pitch": "C4", "midi": 60, "beat": 0, "duration_ms": 500, "track": 0, "instrument": "violin"},
        {"pitch": "E4", "midi": 64, "beat": 1, "duration_ms": 500, "track": 0, "instrument": "violin"},
        {"pitch": "G4", "midi": 67, "beat": 2, "duration_ms": 500, "track": 0, "instrument": "violin"},
    ]
    
    engine = NoteEngine(test_notes, 120)
    print(f"Created note engine with {len(test_notes)} notes at {engine.tempo} BPM")
    print(f"Beat duration: {engine.beat_duration_ms}ms")