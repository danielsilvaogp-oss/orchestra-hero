#!/usr/bin/env python
"""
Orchestra Hero - Interactive Music Learning App
Run this file to start the game.
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import main

if __name__ == "__main__":
    main()