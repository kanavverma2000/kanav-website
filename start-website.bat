@echo off
set PORT=5500
start "" http://localhost:%PORT%
python -m http.server %PORT%
