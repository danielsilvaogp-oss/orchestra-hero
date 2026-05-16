from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import json
import uuid
import zipfile
import shutil

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'web', 'songs')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024

ALLOWED_EXTENSIONS = {'musicxml', 'xml', 'mp3', 'wav', 'ogg', 'json'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/songs')
def get_songs():
    songs = []
    if os.path.exists(UPLOAD_FOLDER):
        for folder in os.listdir(UPLOAD_FOLDER):
            folder_path = os.path.join(UPLOAD_FOLDER, folder)
            if os.path.isdir(folder_path):
                metadata_path = os.path.join(folder_path, 'metadata.json')
                musicxml_files = [f for f in os.listdir(folder_path) 
                                 if f.endswith(('.musicxml', '.xml'))]
                audio_files = [f for f in os.listdir(folder_path) 
                              if f.endswith(('.mp3', '.wav', '.ogg'))]
                
                if os.path.exists(metadata_path):
                    with open(metadata_path, 'r') as f:
                        metadata = json.load(f)
                else:
                    metadata = {
                        'title': folder.replace('_', ' ').title(),
                        'composer': 'Unknown',
                        'difficulty': 'beginner'
                    }
                
                songs.append({
                    'id': folder,
                    'title': metadata.get('title', folder),
                    'composer': metadata.get('composer', 'Unknown'),
                    'difficulty': metadata.get('difficulty', 'beginner'),
                    'tempo': metadata.get('tempo', 120),
                    'has_audio': len(audio_files) > 0,
                    'audio_file': audio_files[0] if audio_files else None,
                    'musicxml_file': musicxml_files[0] if musicxml_files else None
                })
    
    return jsonify(songs)

@app.route('/api/songs/<song_id>')
def get_song(song_id):
    folder_path = os.path.join(UPLOAD_FOLDER, song_id)
    if not os.path.exists(folder_path):
        return jsonify({'error': 'Song not found'}), 404
    
    metadata_path = os.path.join(folder_path, 'metadata.json')
    musicxml_files = [f for f in os.listdir(folder_path) 
                     if f.endswith(('.musicxml', '.xml'))]
    audio_files = [f for f in os.listdir(folder_path) 
                  if f.endswith(('.mp3', '.wav', '.ogg'))]
    
    if os.path.exists(metadata_path):
        with open(metadata_path, 'r') as f:
            metadata = json.load(f)
    else:
        metadata = {'title': song_id}
    
    return jsonify({
        'id': song_id,
        'metadata': metadata,
        'musicxml_file': musicxml_files[0] if musicxml_files else None,
        'audio_file': audio_files[0] if audio_files else None
    })

@app.route('/api/songs/<song_id>/audio')
def get_song_audio(song_id):
    folder_path = os.path.join(UPLOAD_FOLDER, song_id)
    audio_files = [f for f in os.listdir(folder_path) 
                  if f.endswith(('.mp3', '.wav', '.ogg'))]
    if audio_files:
        return send_from_directory(folder_path, audio_files[0])
    return jsonify({'error': 'No audio file'}), 404

@app.route('/api/upload', methods=['POST'])
def upload_song():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if file and allowed_file(file.filename):
        song_id = str(uuid.uuid4())[:8]
        song_folder = os.path.join(UPLOAD_FOLDER, song_id)
        os.makedirs(song_folder, exist_ok=True)
        
        if file.filename.endswith('.zip'):
            zip_path = os.path.join(song_folder, 'upload.zip')
            file.save(zip_path)
            
            try:
                with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                    zip_ref.extractall(song_folder)
                os.remove(zip_path)
            except Exception as e:
                shutil.rmtree(song_folder)
                return jsonify({'error': f'Invalid ZIP file: {str(e)}'}), 400
        else:
            filename = file.filename
            if filename.endswith('.musicxml') or filename.endswith('.xml'):
                filename = 'song.musicxml'
            elif filename.endswith(('.mp3', '.wav', '.ogg')):
                filename = 'audio' + os.path.splitext(filename)[1]
            elif filename.endswith('.json'):
                filename = 'metadata.json'
            
            file.save(os.path.join(song_folder, filename))
        
        musicxml_files = [f for f in os.listdir(song_folder) 
                         if f.endswith(('.musicxml', '.xml'))]
        if not musicxml_files:
            shutil.rmtree(song_folder)
            return jsonify({'error': 'No MusicXML file found'}), 400
        
        metadata_path = os.path.join(song_folder, 'metadata.json')
        if not os.path.exists(metadata_path):
            metadata = {
                'title': 'New Song',
                'composer': 'Unknown',
                'difficulty': 'beginner',
                'tempo': 120
            }
            with open(metadata_path, 'w') as f:
                json.dump(metadata, f, indent=2)
        
        return jsonify({'success': True, 'song_id': song_id})
    
    return jsonify({'error': 'Invalid file type'}), 400

@app.route('/api/upload/metadata', methods=['POST'])
def update_metadata():
    data = request.json
    song_id = data.get('song_id')
    
    if not song_id:
        return jsonify({'error': 'No song ID provided'}), 400
    
    song_folder = os.path.join(UPLOAD_FOLDER, song_id)
    if not os.path.exists(song_folder):
        return jsonify({'error': 'Song not found'}), 404
    
    metadata_path = os.path.join(song_folder, 'metadata.json')
    with open(metadata_path, 'w') as f:
        json.dump(data.get('metadata', {}), f, indent=2)
    
    return jsonify({'success': True})

@app.route('/api/delete/<song_id>', methods=['DELETE'])
def delete_song(song_id):
    song_folder = os.path.join(UPLOAD_FOLDER, song_id)
    if os.path.exists(song_folder):
        shutil.rmtree(song_folder)
        return jsonify({'success': True})
    return jsonify({'error': 'Song not found'}), 404

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)