import xml.etree.ElementTree as ET
import os
import json
from datetime import datetime

NOTE_DURATIONS = {
    "whole": 4.0,
    "half": 2.0,
    "quarter": 1.0,
    "eighth": 0.5,
    "16th": 0.25,
    "32nd": 0.125,
    "64th": 0.0625
}

STEP_TO_SEMITONE = {
    "C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11
}

def step_to_midi(step, octave):
    base = STEP_TO_SEMITONE.get(step.upper(), 0)
    return (octave + 1) * 12 + base

def get_accidental_offset(alter):
    if alter is None:
        return 0
    return int(alter)

class MusicXMLParser:
    def __init__(self, file_path):
        self.file_path = file_path
        self.tree = None
        self.root = None
        self.metadata = {}
        self.parts = []
        self.tempo = 120
        self.time_signature = (4, 4)
        
    def parse(self):
        try:
            self.tree = ET.parse(self.file_path)
            self.root = self.tree.getroot()
            self._parse_metadata()
            self._parse_parts()
            return True
        except Exception as e:
            print(f"Error parsing MusicXML: {e}")
            return False
    
    def _get_namespace(self):
        if "{" in self.root.tag:
            return self.root.tag.split("}")[0].strip("{")
        return None
    
    def _resolve_tag(self, tag):
        ns = self._get_namespace()
        if ns:
            return f"{{{ns}}}{tag}"
        return tag
    
    def _parse_metadata(self):
        identification = self.root.find(self._resolve_tag("identification"))
        if identification is not None:
            creator = identification.find(self._resolve_tag("creator"))
            if creator is not None:
                self.metadata["composer"] = creator.text or "Unknown"
        
        work = self.root.find(self._resolve_tag("work"))
        if work is not None:
            work_title = work.find(self._resolve_tag("work-title"))
            if work_title is not None:
                self.metadata["title"] = work_title.text or "Untitled"
        
        defaults = self.root.find(self._resolve_tag("defaults"))
        if defaults is not None:
            sound = defaults.find(self._resolve_tag("sound"))
            if sound is not None:
                tempo = sound.get("tempo")
                if tempo:
                    self.tempo = float(tempo)
        
        part_list = self.root.find(self._resolve_tag("part-list"))
        if part_list is not None:
            self.metadata["instruments"] = []
            for score_part in part_list.findall(self._resolve_tag("score-part")):
                part_id = score_part.get("id")
                part_name = score_part.find(self._resolve_tag("part-name"))
                instrument = score_part.find(self._resolve_tag("score-instrument"))
                instrument_name = "Unknown"
                if instrument is not None:
                    instrument_name_elem = instrument.find(self._resolve_tag("instrument-name"))
                    if instrument_name_elem is not None:
                        instrument_name = instrument_name_elem.text or "Unknown"
                
                self.metadata["instruments"].append({
                    "id": part_id,
                    "name": part_name.text if part_name is not None else "Unknown",
                    "instrument": instrument_name
                })
        
        if "title" not in self.metadata:
            filename = os.path.basename(self.file_path)
            self.metadata["title"] = os.path.splitext(filename)[0]
    
    def _parse_parts(self):
        for part_elem in self.root.findall(self._resolve_tag("part")):
            part_id = part_elem.get("id")
            self._parse_part(part_id, part_elem)
    
    def _parse_part(self, part_id, part_elem):
        part_data = {
            "id": part_id,
            "name": "Unknown",
            "instrument": "Unknown",
            "notes": [],
            "measures": []
        }
        
        for idx, measure_elem in enumerate(part_elem.findall(self._resolve_tag("measure"))):
            measure_data = self._parse_measure(measure_elem, idx + 1)
            part_data["measures"].append(measure_data)
            part_data["notes"].extend(measure_data["notes"])
        
        self.parts.append(part_data)
    
    def _parse_measure(self, measure_elem, measure_number):
        measure_data = {
            "number": measure_number,
            "notes": [],
            "attributes": {}
        }
        
        attributes = measure_elem.find(self._resolve_tag("attributes"))
        if attributes is not None:
            time_elem = attributes.find(self._resolve_tag("time"))
            if time_elem is not None:
                beats = time_elem.find(self._resolve_tag("beats"))
                beat_type = time_elem.find(self._resolve_tag("beat-type"))
                if beats is not None and beat_type is not None:
                    measure_data["attributes"]["time_signature"] = (
                        int(beats.text), int(beat_type.text)
                    )
            
            divisions_elem = attributes.find(self._resolve_tag("divisions"))
            if divisions_elem is not None:
                measure_data["attributes"]["divisions"] = int(divisions_elem.text)
        
        current_beat = 0
        for note_elem in measure_elem.findall(self._resolve_tag("note")):
            note_data = self._parse_note(note_elem, current_beat, measure_number)
            if note_data:
                measure_data["notes"].append(note_data)
                duration = note_data.get("duration_ms", 0)
                if duration > 0:
                    current_beat += note_data.get("duration_divisions", 1)
        
        return measure_data
    
    def _parse_note(self, note_elem, current_beat, measure_number):
        pitch_elem = note_elem.find(self._resolve_tag("pitch"))
        if pitch_elem is None:
            rest = note_elem.find(self._resolve_tag("rest"))
            if rest is not None:
                return None
        
        duration_elem = note_elem.find(self._resolve_tag("duration"))
        if duration_elem is None:
            return None
        
        divisions = int(duration_elem.text)
        duration_beats = divisions / 4.0
        
        type_elem = note_elem.find(self._resolve_tag("type"))
        note_type = type_elem.text if type_elem is not None else "quarter"
        
        base_duration = NOTE_DURATIONS.get(note_type, 1.0)
        actual_beats = base_duration * (divisions / 4.0)
        
        note_data = {
            "beat": current_beat,
            "measure": measure_number,
            "duration_divisions": divisions,
            "duration_beats": actual_beats,
            "duration_ms": int(60000 / self.tempo * actual_beats),
            "type": note_type
        }
        
        if pitch_elem is not None:
            step = pitch_elem.find(self._resolve_tag("step"))
            octave = pitch_elem.find(self._resolve_tag("octave"))
            alter = pitch_elem.find(self._resolve_tag("alter"))
            
            step_char = step.text if step is not None else "C"
            octave_num = int(octave.text) if octave is not None else 4
            
            accidentals = 0
            if alter is not None:
                accidentals = int(alter.text)
            
            note_data["step"] = step_char
            note_data["octave"] = octave_num
            note_data["alter"] = accidentals
            note_data["pitch"] = f"{step_char}{octave_num}"
            note_data["midi"] = step_to_midi(step_char, octave_num) + accidentals
            
            string_elem = note_elem.find(self._resolve_tag("string"))
            fret_elem = note_elem.find(self._resolve_tag("fret"))
            if string_elem is not None:
                note_data["string"] = int(string_elem.text)
            if fret_elem is not None:
                note_data["fret"] = int(fret_elem.text)
        
        finger_elem = note_elem.find(self._resolve_tag("finger"))
        if finger_elem is not None:
            note_data["fingering"] = finger_elem.text
        
        notations = note_elem.find(self._resolve_tag("notations"))
        if notations is not None:
            articulations = []
            for art in notations.findall(self._resolve_tag("articulation")):
                articulations.append(art.tag)
            
            dynamics = notations.find(self._resolve_tag("dynamics"))
            if dynamics is not None:
                for dyn in list(dynamics):
                    note_data["dynamic"] = dyn.tag.replace("}", "").split("}")[-1]
            
            slur = notations.find(self._resolve_tag("slur"))
            if slur is not None:
                note_data["slur"] = slur.get("type")
            
            if articulations:
                note_data["articulations"] = articulations
        
        return note_data
    
    def get_all_notes(self, track_filter=None):
        all_notes = []
        for idx, part in enumerate(self.parts):
            if track_filter is not None and idx != track_filter:
                continue
            
            for note in part["notes"]:
                note_copy = note.copy()
                note_copy["track"] = idx
                note_copy["instrument"] = part.get("instrument", "Unknown")
                note_copy["part_name"] = part.get("name", "Unknown")
                all_notes.append(note_copy)
        
        all_notes.sort(key=lambda n: n["beat"])
        return all_notes
    
    def get_tracks(self):
        return [
            {
                "id": idx,
                "name": part.get("name", "Unknown"),
                "instrument": part.get("instrument", "Unknown"),
                "note_count": len(part["notes"])
            }
            for idx, part in enumerate(self.parts)
        ]
    
    def get_song_info(self):
        return {
            "title": self.metadata.get("title", "Untitled"),
            "composer": self.metadata.get("composer", "Unknown"),
            "tempo": self.tempo,
            "tracks": self.get_tracks(),
            "instruments": self.metadata.get("instruments", [])
        }
    
    def to_json(self):
        return {
            "metadata": self.metadata,
            "tempo": self.tempo,
            "parts": self.parts,
            "tracks": self.get_tracks()
        }

def load_song(song_path):
    musicxml_files = []
    for root, dirs, files in os.walk(song_path):
        for file in files:
            if file.endswith(".musicxml") or file.endswith(".xml"):
                musicxml_files.append(os.path.join(root, file))
    
    if not musicxml_files:
        return None
    
    parser = MusicXMLParser(musicxml_files[0])
    if parser.parse():
        return parser
    return None

def create_sample_song():
    sample_path = os.path.join(os.path.dirname(__file__), "..", "..", "songs", "ode_to_joy", "song.musicxml")
    
    ns = "http://www.musicxml.org/schema/MusicXML"
    
    musicxml = f'''<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1" xmlns="{ns}">
  <work>
    <work-title>Ode to Joy</work-title>
  </work>
  <identification>
    <creator type="composer">Ludwig van Beethoven</creator>
  </identification>
  <defaults>
    <sound tempo="120"/>
  </defaults>
  <part-list>
    <score-part id="P1">
      <part-name>Violin</part-name>
      <score-instrument id="I1">
        <instrument-name>Violin</instrument-name>
      </score-instrument>
    </score-part>
    <score-part id="P2">
      <part-name>Flute</part-name>
      <score-instrument id="I2">
        <instrument-name>Flute</instrument-name>
      </score-instrument>
    </score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <note>
        <pitch><step>E</step><octave>4</octave></pitch>
        <duration>4</duration>
        <type>quarter</type>
      </note>
      <note>
        <pitch><step>E</step><octave>4</octave></pitch>
        <duration>4</duration>
        <type>quarter</type>
      </note>
      <note>
        <pitch><step>F</step><octave>4</octave></pitch>
        <duration>4</duration>
        <type>quarter</type>
      </note>
      <note>
        <pitch><step>G</step><octave>4</octave></pitch>
        <duration>4</duration>
        <type>quarter</type>
      </note>
    </measure>
    <measure number="2">
      <note>
        <pitch><step>G</step><octave>4</octave></pitch>
        <duration>4</duration>
        <type>quarter</type>
      </note>
      <note>
        <pitch><step>F</step><octave>4</octave></pitch>
        <duration>4</duration>
        <type>quarter</type>
      </note>
      <note>
        <pitch><step>E</step><octave>4</octave></pitch>
        <duration>4</duration>
        <type>quarter</type>
      </note>
      <note>
        <pitch><step>D</step><octave>4</octave></pitch>
        <duration>4</duration>
        <type>quarter</type>
      </note>
    </measure>
    <measure number="3">
      <note>
        <pitch><step>C</step><octave>4</octave></pitch>
        <duration>4</duration>
        <type>quarter</type>
      </note>
      <note>
        <pitch><step>C</step><octave>4</octave></pitch>
        <duration>4</duration>
        <type>quarter</type>
      </note>
      <note>
        <pitch><step>D</step><octave>4</octave></pitch>
        <duration>4</duration>
        <type>quarter</type>
      </note>
      <note>
        <pitch><step>E</step><octave>4</octave></pitch>
        <duration>4</duration>
        <type>quarter</type>
      </note>
    </measure>
    <measure number="4">
      <note>
        <pitch><step>E</step><octave>4</octave></pitch>
        <duration>4</duration>
        <type>quarter</type>
      </note>
      <note>
        <pitch><step>D</step><octave>4</octave></pitch>
        <duration>4</duration>
        <type>quarter</type>
      </note>
      <note>
        <pitch><step>D</step><octave>4</octave></pitch>
        <duration>8</duration>
        <type>half</type>
      </note>
    </measure>
  </part>
  <part id="P2">
    <measure number="1">
      <note>
        <pitch><step>E</step><octave>5</octave></pitch>
        <duration>4</duration>
        <type>quarter</type>
      </note>
      <note>
        <pitch><step>E</step><octave>5</octave></pitch>
        <duration>4</duration>
        <type>quarter</type>
      </note>
      <note>
        <pitch><step>F</step><octave>5</octave></pitch>
        <duration>4</duration>
        <type>quarter</type>
      </note>
      <note>
        <pitch><step>G</step><octave>5</octave></pitch>
        <duration>4</duration>
        <type>quarter</type>
      </note>
    </measure>
    <measure number="2">
      <note>
        <pitch><step>G</step><octave>5</octave></pitch>
        <duration>4</duration>
        <type>quarter</type>
      </note>
      <note>
        <pitch><step>F</step><octave>5</octave></pitch>
        <duration>4</duration>
        <type>quarter</type>
      </note>
      <note>
        <pitch><step>E</step><octave>5</octave></pitch>
        <duration>4</duration>
        <type>quarter</type>
      </note>
      <note>
        <pitch><step>D</step><octave>5</octave></pitch>
        <duration>4</duration>
        <type>quarter</type>
      </note>
    </measure>
    <measure number="3">
      <note>
        <pitch><step>C</step><octave>5</octave></pitch>
        <duration>4</duration>
        <type>quarter</type>
      </note>
      <note>
        <pitch><step>C</step><octave>5</octave></pitch>
        <duration>4</duration>
        <type>quarter</type>
      </note>
      <note>
        <pitch><step>D</step><octave>5</octave></pitch>
        <duration>4</duration>
        <type>quarter</type>
      </note>
      <note>
        <pitch><step>E</step><octave>5</octave></pitch>
        <duration>4</duration>
        <type>quarter</type>
      </note>
    </measure>
    <measure number="4">
      <note>
        <pitch><step>E</step><octave>5</octave></pitch>
        <duration>4</duration>
        <type>quarter</type>
      </note>
      <note>
        <pitch><step>D</step><octave>5</octave></pitch>
        <duration>4</duration>
        <type>quarter</type>
      </note>
      <note>
        <pitch><step>D</step><octave>5</octave></pitch>
        <duration>8</duration>
        <type>half</type>
      </note>
    </measure>
  </part>
</score-partwise>'''
    
    os.makedirs(os.path.dirname(sample_path), exist_ok=True)
    with open(sample_path, "w", encoding="utf-8") as f:
        f.write(musicxml)
    
    metadata_path = os.path.join(os.path.dirname(sample_path), "metadata.json")
    metadata = {
        "title": "Ode to Joy",
        "composer": "Ludwig van Beethoven",
        "difficulty": "beginner",
        "tempo": 120,
        "instruments": ["violin", "flute"],
        "description": "Beethoven's 9th Symphony theme - Perfect for beginners"
    }
    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2)
    
    return sample_path

if __name__ == "__main__":
    create_sample_song()
    parser = MusicXMLParser(os.path.join(os.path.dirname(__file__), "..", "..", "songs", "ode_to_joy", "song.musicxml"))
    if parser.parse():
        print(f"Title: {parser.metadata.get('title')}")
        print(f"Composer: {parser.metadata.get('composer')}")
        print(f"Tempo: {parser.tempo}")
        print(f"Parts: {len(parser.parts)}")
        notes = parser.get_all_notes()
        print(f"Total notes: {len(notes)}")
        for note in notes[:10]:
            print(f"  {note['pitch']} at beat {note['beat']} for {note['duration_ms']}ms")