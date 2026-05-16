import os
import json

def create_flight_of_bumblebee():
    ns = "http://www.musicxml.org/schema/MusicXML"
    
    musicxml = f'''<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1" xmlns="{ns}">
  <work>
    <work-title>Flight of the Bumblebee</work-title>
  </work>
  <identification>
    <creator type="composer">Nikolai Rimsky-Korsakov</creator>
  </identification>
  <defaults>
    <sound tempo="180"/>
  </defaults>
  <part-list>
    <score-part id="P1">
      <part-name>Flute</part-name>
    </score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <note><pitch><step>G</step><octave>5</octave></pitch><duration>4</duration><type>16th</type></note>
      <note><pitch><step>F</step><octave>5</octave></pitch><duration>4</duration><type>16th</type></note>
      <note><pitch><step>E</step><octave>5</octave></pitch><duration>4</duration><type>16th</type></note>
      <note><pitch><step>F</step><octave>5</octave></pitch><duration>4</duration><type>16th</type></note>
      <note><pitch><step>E</step><octave>5</octave></pitch><duration>4</duration><type>16th</type></note>
      <note><pitch><step>D</step><octave>5</octave></pitch><duration>4</duration><type>16th</type></note>
      <note><pitch><step>E</step><octave>5</octave></pitch><duration>4</duration><type>16th</type></note>
      <note><pitch><step>D</step><octave>5</octave></pitch><duration>4</duration><type>16th</type></note>
      <note><pitch><step>C</step><octave>5</octave></pitch><duration>4</duration><type>16th</type></note>
      <note><pitch><step>D</step><octave>5</octave></pitch><duration>4</duration><type>16th</type></note>
      <note><pitch><step>E</step><octave>5</octave></pitch><duration>4</duration><type>16th</type></note>
      <note><pitch><step>D</step><octave>5</octave></pitch><duration>4</duration><type>16th</type></note>
    </measure>
    <measure number="2">
      <note><pitch><step>C</step><octave>5</octave></pitch><duration>4</duration><type>16th</type></note>
      <note><pitch><step>B</step><octave>4</octave></pitch><duration>4</duration><type>16th</type></note>
      <note><pitch><step>C</step><octave>5</octave></pitch><duration>4</duration><type>16th</type></note>
      <note><pitch><step>B</step><octave>4</octave></pitch><duration>4</duration><type>16th</type></note>
      <note><pitch><step>A</step><octave>4</octave></pitch><duration>4</duration><type>16th</type></note>
      <note><pitch><step>B</step><octave>4</octave></pitch><duration>4</duration><type>16th</type></note>
      <note><pitch><step>A</step><octave>4</octave></pitch><duration>4</duration><type>16th</type></note>
      <note><pitch><step>G</step><octave>4</octave></pitch><duration>4</duration><type>16th</type></note>
      <note><pitch><step>A</step><octave>4</octave></pitch><duration>4</duration><type>16th</type></note>
      <note><pitch><step>G</step><octave>4</octave></pitch><duration>4</duration><type>16th</type></note>
      <note><pitch><step>F</step><octave>4</octave></pitch><duration>4</duration><type>16th</type></note>
      <note><pitch><step>G</step><octave>4</octave></pitch><duration>4</duration><type>16th</type></note>
    </measure>
  </part>
</score-partwise>'''
    
    song_path = os.path.join(os.path.dirname(__file__), "..", "..", "songs", "flight_of_bumblebee", "song.musicxml")
    os.makedirs(os.path.dirname(song_path), exist_ok=True)
    with open(song_path, "w", encoding="utf-8") as f:
        f.write(musicxml)
    print(f"Created: {song_path}")

def create_simple_scales():
    ns = "http://www.musicxml.org/schema/MusicXML"
    
    musicxml = f'''<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1" xmlns="{ns}">
  <work>
    <work-title>C Major Scale Practice</work-title>
  </work>
  <identification>
    <creator type="composer">Practice</creator>
  </identification>
  <defaults>
    <sound tempo="80"/>
  </defaults>
  <part-list>
    <score-part id="P1">
      <part-name>Violin</part-name>
    </score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <note><pitch><step>C</step><octave>4</octave></pitch><duration>4</duration><type>quarter</type></note>
      <note><pitch><step>D</step><octave>4</octave></pitch><duration>4</duration><type>quarter</type></note>
      <note><pitch><step>E</step><octave>4</octave></pitch><duration>4</duration><type>quarter</type></note>
      <note><pitch><step>F</step><octave>4</octave></pitch><duration>4</duration><type>quarter</type></note>
      <note><pitch><step>G</step><octave>4</octave></pitch><duration>4</duration><type>quarter</type></note>
      <note><pitch><step>A</step><octave>4</octave></pitch><duration>4</duration><type>quarter</type></note>
      <note><pitch><step>B</step><octave>4</octave></pitch><duration>4</duration><type>quarter</type></note>
      <note><pitch><step>C</step><octave>5</octave></pitch><duration>4</duration><type>quarter</type></note>
    </measure>
    <measure number="2">
      <note><pitch><step>C</step><octave>5</octave></pitch><duration>4</duration><type>quarter</type></note>
      <note><pitch><step>B</step><octave>4</octave></pitch><duration>4</duration><type>quarter</type></note>
      <note><pitch><step>A</step><octave>4</octave></pitch><duration>4</duration><type>quarter</type></note>
      <note><pitch><step>G</step><octave>4</octave></pitch><duration>4</duration><type>quarter</type></note>
      <note><pitch><step>F</step><octave>4</octave></pitch><duration>4</duration><type>quarter</type></note>
      <note><pitch><step>E</step><octave>4</octave></pitch><duration>4</duration><type>quarter</type></note>
      <note><pitch><step>D</step><octave>4</octave></pitch><duration>4</duration><type>quarter</type></note>
      <note><pitch><step>C</step><octave>4</octave></pitch><duration>4</duration><type>quarter</type></note>
    </measure>
  </part>
</score-partwise>'''
    
    song_path = os.path.join(os.path.dirname(__file__), "..", "..", "songs", "c_major_scale", "song.musicxml")
    os.makedirs(os.path.dirname(song_path), exist_ok=True)
    with open(song_path, "w", encoding="utf-8") as f:
        f.write(musicxml)
    
    metadata = {
        "title": "C Major Scale Practice",
        "composer": "Practice",
        "difficulty": "beginner",
        "tempo": 80,
        "instruments": ["violin"],
        "description": "Simple C major scale for beginners"
    }
    metadata_path = os.path.join(os.path.dirname(song_path), "metadata.json")
    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2)
    
    print(f"Created: {song_path}")

if __name__ == "__main__":
    create_flight_of_bumblebee()
    create_simple_scales()