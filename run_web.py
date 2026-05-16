#!/usr/bin/env python
"""
Run Orchestra Hero Web Version
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from web_app import app

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"Starting Orchestra Hero Web on http://localhost:{port}")
    print("Press Ctrl+C to stop")
    app.run(host='0.0.0.0', port=port, debug=True)