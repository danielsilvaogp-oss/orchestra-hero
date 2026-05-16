from app.config import INSTRUMENT_COLORS

class InstrumentTemplate:
    def __init__(self, name, midi_range, clef, keys, color, **kwargs):
        self.name = name
        self.low_midi = midi_range[0]
        self.high_midi = midi_range[1]
        self.clef = clef
        self.keys = keys
        self.color = color
        self.string_count = kwargs.get("string_count", 0)
        self.valve_count = kwargs.get("valve_count", 0)
        self.techniques = kwargs.get("techniques", [])
        self.finger_chart = kwargs.get("finger_chart", {})
        self.lane_mapping = kwargs.get("lane_mapping", {})
    
    def get_lane_for_note(self, midi_note):
        return self.lane_mapping.get(midi_note % 12, 0)
    
    def is_in_range(self, midi_note):
        return self.low_midi <= midi_note <= self.high_midi

class InstrumentManager:
    _instruments = {}
    _initialized = False
    
    @classmethod
    def initialize(cls):
        if cls._initialized:
            return
        
        cls._instruments = {
            "violin": InstrumentTemplate(
                name="Violin",
                midi_range=(55, 103),
                clef="treble",
                keys=["E", "A", "D", "G"],
                color=INSTRUMENT_COLORS["violin"],
                string_count=4,
                techniques=["pizzicato", "col_legno", "sul_ponticello", "tremolo"],
                lane_mapping={0: 3, 2: 2, 4: 1, 7: 0}
            ),
            "viola": InstrumentTemplate(
                name="Viola",
                midi_range=(50, 93),
                clef="alto",
                keys=["C", "G", "D", "A"],
                color=INSTRUMENT_COLORS["viola"],
                string_count=4,
                techniques=["pizzicato", "col_legno", "sul_ponticello"],
                lane_mapping={0: 0, 2: 1, 4: 2, 7: 3}
            ),
            "cello": InstrumentTemplate(
                name="Cello",
                midi_range=(36, 96),
                clef="treble",
                keys=["C", "G", "D", "A"],
                color=INSTRUMENT_COLORS["cello"],
                string_count=4,
                techniques=["pizzicato", "tremolo", "sul_tasto", "sul_ponticello"],
                lane_mapping={0: 0, 2: 1, 4: 2, 7: 3}
            ),
            "double_bass": InstrumentTemplate(
                name="Double Bass",
                midi_range=(28, 67),
                clef="bass",
                keys=["E", "A", "D", "G"],
                color=INSTRUMENT_COLORS["double_bass"],
                string_count=4,
                techniques=["pizzicato", "tremolo"],
                lane_mapping={0: 0, 2: 1, 4: 2, 7: 3}
            ),
            "flute": InstrumentTemplate(
                name="Flute",
                midi_range=(60, 108),
                clef="treble",
                keys=["C", "D", "E", "F", "G", "A", "B"],
                color=INSTRUMENT_COLORS["flute"],
                techniques=["single_tongue", "double_tongue", "flutter", "trill"],
                finger_chart={
                    "C4": [0, 0, 0, 0, 0, 0],
                    "D4": [0, 0, 0, 1, 0, 0],
                    "E4": [0, 0, 0, 1, 1, 0],
                    "F4": [0, 0, 1, 1, 1, 0],
                    "G4": [0, 1, 1, 1, 1, 0],
                    "A4": [1, 1, 1, 1, 1, 0],
                    "B4": [1, 1, 1, 1, 1, 1]
                },
                lane_mapping={0: 0, 2: 0, 4: 1, 5: 1, 7: 2, 9: 2, 11: 3}
            ),
            "oboe": InstrumentTemplate(
                name="Oboe",
                midi_range=(58, 89),
                clef="treble",
                keys=["C", "D", "E", "F", "G", "A", "B"],
                color=INSTRUMENT_COLORS["oboe"],
                techniques=["single_tongue", "double_tongue"],
                finger_chart={
                    "C4": [1, 0, 0, 0, 0],
                    "D4": [1, 0, 0, 1, 0],
                    "E4": [1, 0, 1, 1, 0],
                    "F4": [1, 1, 1, 1, 0],
                    "G4": [0, 1, 1, 1, 1]
                },
                lane_mapping={0: 0, 2: 0, 4: 1, 5: 1, 7: 2, 9: 2, 11: 3}
            ),
            "clarinet": InstrumentTemplate(
                name="Clarinet (Bb)",
                midi_range=(50, 103),
                clef="treble",
                keys=["C", "D", "E", "F", "G", "A", "B"],
                color=INSTRUMENT_COLORS["clarinet"],
                techniques=["single_tongue", "double_tongue", "glissando"],
                finger_chart={
                    "C4": [0, 0, 0, 0, 0, 0, 0],
                    "D4": [0, 0, 0, 0, 0, 1, 0],
                    "E4": [0, 0, 0, 0, 1, 1, 0],
                    "F4": [0, 0, 0, 1, 1, 1, 0],
                    "G4": [0, 1, 1, 1, 1, 1, 0],
                    "A4": [1, 1, 1, 1, 1, 1, 0],
                    "B4": [1, 1, 1, 1, 1, 1, 1]
                },
                lane_mapping={0: 0, 2: 0, 4: 1, 5: 1, 7: 2, 9: 2, 11: 3}
            ),
            "bassoon": InstrumentTemplate(
                name="Bassoon",
                midi_range=(34, 75),
                clef="bass",
                keys=["C", "D", "E", "F", "G", "A", "B"],
                color=INSTRUMENT_COLORS["bassoon"],
                techniques=["single_tongue", "double_tongue", "wind"],
                finger_chart={
                    "C2": [0, 0, 0, 0, 0],
                    "D2": [0, 0, 0, 1, 0],
                    "E2": [0, 0, 1, 1, 0],
                    "F2": [0, 1, 1, 1, 0],
                    "G2": [1, 1, 1, 1, 0],
                    "A2": [1, 1, 1, 1, 1]
                },
                lane_mapping={0: 0, 2: 1, 4: 1, 5: 2, 7: 2, 9: 3, 11: 3}
            ),
            "french_horn": InstrumentTemplate(
                name="French Horn",
                midi_range=(41, 89),
                clef="treble",
                keys=["B", "C", "D", "E", "F", "G"],
                color=INSTRUMENT_COLORS["french_horn"],
                valve_count=3,
                techniques=["stopped", "muted", "hand_stopping"],
                finger_chart={
                    "C3": [0, 0, 0],
                    "D3": [0, 0, 1],
                    "E3": [0, 1, 0],
                    "F3": [0, 1, 1],
                    "G3": [1, 0, 0],
                    "A3": [1, 0, 1],
                    "B3": [1, 1, 0],
                    "C4": [1, 1, 1]
                },
                lane_mapping={11: 0, 0: 1, 2: 1, 4: 2, 5: 2, 7: 3, 9: 3}
            ),
            "trumpet": InstrumentTemplate(
                name="Trumpet (Bb)",
                midi_range=(50, 96),
                clef="treble",
                keys=["C", "D", "E", "F", "G", "A", "B"],
                color=INSTRUMENT_COLORS["trumpet"],
                valve_count=3,
                techniques=["single_tongue", "double_tongue", "triple_tongue"],
                finger_chart={
                    "C4": [0, 0, 0],
                    "D4": [0, 0, 1],
                    "E4": [0, 1, 0],
                    "F4": [0, 1, 1],
                    "G4": [1, 0, 0],
                    "A4": [1, 0, 1],
                    "B4": [1, 1, 0],
                    "C5": [1, 1, 1]
                },
                lane_mapping={0: 0, 2: 0, 4: 1, 5: 1, 7: 2, 9: 2, 11: 3}
            ),
            "trombone": InstrumentTemplate(
                name="Trombone",
                midi_range=(40, 75),
                clef="bass",
                keys=["C", "D", "E", "F", "G", "A", "B"],
                color=INSTRUMENT_COLORS["trombone"],
                valve_count=1,
                techniques=["single_tongue", "double_tongue", "glissando"],
                finger_chart={
                    "E2": 1,
                    "F2": 2,
                    "G2": 3,
                    "A2": 4,
                    "B2": 5,
                    "C3": 6,
                    "D3": 7,
                    "E3": "T"
                },
                lane_mapping={4: 0, 5: 0, 7: 1, 9: 1, 11: 2, 0: 2, 2: 3}
            ),
            "tuba": InstrumentTemplate(
                name="Tuba",
                midi_range=(28, 65),
                clef="bass",
                keys=["C", "D", "E", "F", "G", "A", "B"],
                color=INSTRUMENT_COLORS["tuba"],
                valve_count=4,
                techniques=["single_tongue", "double_tongue"],
                finger_chart={
                    "C2": [0, 0, 0, 0],
                    "D2": [0, 0, 0, 1],
                    "E2": [0, 0, 1, 0],
                    "F2": [0, 0, 1, 1],
                    "G2": [0, 1, 0, 0],
                    "A2": [0, 1, 0, 1],
                    "B2": [0, 1, 1, 0],
                    "C3": [1, 0, 0, 0]
                },
                lane_mapping={0: 0, 2: 1, 4: 1, 5: 2, 7: 2, 9: 3, 11: 3}
            ),
            "timpani": InstrumentTemplate(
                name="Timpani",
                midi_range=(40, 55),
                clef="bass",
                keys=["D", "F#", "Bb", "C"],
                color=INSTRUMENT_COLORS["timpani"],
                techniques=["single_stroke", "roll"],
                lane_mapping={2: 0, 6: 1, 10: 2, 0: 3}
            ),
            "snare_drum": InstrumentTemplate(
                name="Snare Drum",
                midi_range=(60, 80),
                clef="treble",
                keys=["snare"],
                color=INSTRUMENT_COLORS["snare_drum"],
                techniques=["single_stroke", "double_stroke", "paradiddle", "roll"],
                lane_mapping={0: 0}
            ),
            "piano": InstrumentTemplate(
                name="Piano",
                midi_range=(21, 108),
                clef="treble",
                keys=["C", "D", "E", "F", "G", "A", "B"],
                color=INSTRUMENT_COLORS["piano"],
                techniques=["legato", "staccato", "pedal"],
                lane_mapping={0: 0, 2: 1, 4: 2, 5: 3, 7: 4, 9: 5, 11: 6}
            ),
            "harp": InstrumentTemplate(
                name="Harp",
                midi_range=(36, 96),
                clef="treble",
                keys=["C", "D", "E", "F", "G", "A", "B"],
                color=INSTRUMENT_COLORS["harp"],
                techniques=["glissando", "pedal_change"],
                finger_chart={
                    "C": [0, 0, 0],
                    "D": [0, 0, 1],
                    "E": [0, 1, 0],
                    "F": [0, 1, 1],
                    "G": [1, 0, 0],
                    "A": [1, 0, 1],
                    "B": [1, 1, 0]
                },
                lane_mapping={0: 0, 2: 1, 4: 2, 5: 2, 7: 3, 9: 4, 11: 5}
            )
        }
        
        cls._initialized = True
    
    @classmethod
    def get_instrument(cls, name):
        cls.initialize()
        name_lower = name.lower().replace(" ", "_").replace("(bb)", "").replace("(eb)", "")
        return cls._instruments.get(name_lower)
    
    @classmethod
    def get_all_instruments(cls):
        cls.initialize()
        return list(cls._instruments.values())
    
    @classmethod
    def get_lane_for_instrument_note(cls, instrument_name, midi_note):
        instrument = cls.get_instrument(instrument_name)
        if instrument:
            return instrument.get_lane_for_note(midi_note)
        return midi_note % 4
    
    @classmethod
    def get_instrument_by_midi_range(cls, midi_note):
        cls.initialize()
        for name, instrument in cls._instruments.items():
            if instrument.is_in_range(midi_note):
                return instrument
        return None
    
    @classmethod
    def register_instrument(cls, name, template):
        cls._instruments[name.lower()] = template

class InstrumentFactory:
    @staticmethod
    def create_instrument(instrument_type, **kwargs):
        InstrumentManager.initialize()
        instrument = InstrumentManager.get_instrument(instrument_type)
        if instrument:
            return instrument
        
        return InstrumentTemplate(
            name=instrument_type,
            midi_range=kwargs.get("midi_range", (60, 84)),
            clef=kwargs.get("clef", "treble"),
            keys=kwargs.get("keys", ["C", "D", "E", "F"]),
            color=kwargs.get("color", (128, 128, 128)),
            lane_mapping=kwargs.get("lane_mapping", {})
        )

def get_instrument_color(instrument_name):
    InstrumentManager.initialize()
    instrument = InstrumentManager.get_instrument(instrument_name)
    if instrument:
        return instrument.color
    
    name_lower = instrument_name.lower()
    if "violin" in name_lower:
        return INSTRUMENT_COLORS["violin"]
    elif "viola" in name_lower:
        return INSTRUMENT_COLORS["viola"]
    elif "cello" in name_lower:
        return INSTRUMENT_COLORS["cello"]
    elif "flute" in name_lower:
        return INSTRUMENT_COLORS["flute"]
    elif "clarinet" in name_lower:
        return INSTRUMENT_COLORS["clarinet"]
    elif "trumpet" in name_lower:
        return INSTRUMENT_COLORS["trumpet"]
    elif "horn" in name_lower:
        return INSTRUMENT_COLORS["french_horn"]
    elif "trombone" in name_lower:
        return INSTRUMENT_COLORS["trombone"]
    elif "tuba" in name_lower:
        return INSTRUMENT_COLORS["tuba"]
    elif "piano" in name_lower:
        return INSTRUMENT_COLORS["piano"]
    elif "harp" in name_lower:
        return INSTRUMENT_COLORS["harp"]
    
    return (150, 150, 150)

if __name__ == "__main__":
    InstrumentManager.initialize()
    
    for name in ["violin", "flute", "trumpet", "piano"]:
        inst = InstrumentManager.get_instrument(name)
        if inst:
            print(f"{name}: {inst.name}, range: {inst.low_midi}-{inst.high_midi}, strings: {inst.string_count}")