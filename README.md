# NEXUS // Quantum Workstation

A redesigned four-file GitHub Pages build. Replace **index.html, style.css, script.js and README.md together**.

## Included
- NEXUS futuristic desktop UI
- Terminal with persistent browser virtual filesystem
- Linux-style commands: `ls`, `cd`, `pwd`, `mkdir`, `touch`, `cat`, `echo`, `rm`, `tree`, `history`, `calc`, `env`, `export`
- Package-state commands: `pkg update`, `pkg upgrade`, `pkg install`, `pkg remove`, `pkg search`, `pkg list-installed`
- Real browser APIs: microphone, camera, notifications, vibration, clipboard, downloads, share, fullscreen and fetch where browser permissions/CORS allow
- Arena survival game with WASD/touch, shooting, enemies, waves, HP, score and best score
- Mobile responsive UI and persistent localStorage state

## Important
This is a browser application, not an Android Linux userspace. A GitHub Pages site cannot install native Android/Linux binaries or give arbitrary `/system` access. The package manager here manages NEXUS's own package state. For genuinely executable Python/GCC/Git and long-running Linux servers, use the separate native Android build.
