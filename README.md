# NEXUS — Native Browser System

NEXUS is an original browser desktop/console. It is designed around **real browser APIs**, not fake success messages.

## Real commands

- `mic` — requests microphone permission and measures live input level
- `mic off` — stops the microphone stream
- `camera` — requests camera permission and opens a live preview
- `notify Hello` — sends a real browser notification after permission
- `vibrate 300` — requests device vibration where supported
- `clipboard Hello` — writes to the real system clipboard
- `download file.txt Hello` — creates a real downloadable file
- `share Hello` — opens the device/browser share sheet where supported
- `fullscreen` — requests browser fullscreen
- `fetch https://...` — makes a real CORS-enabled web request when the target allows it
- `webinfo` — reports which browser capabilities are available

## NEXUS environment

The filesystem and package database are persistent in browser storage. Commands such as `ls`, `cd`, `mkdir`, `touch`, `cat`, `cp`, `mv`, `rm`, `tree`, `echo`, and `history` actually modify/read that NEXUS environment.

`pkg update`, `pkg install`, `pkg remove`, `pkg search`, `pkg info`, and `pkg upgrade` update the NEXUS package state.

### Python

After `pkg install python`, the `python` command loads a real Python WebAssembly runtime in the browser. Example:

```text
pkg update
pkg install python
python -c "print(2+2)"
```

This executes Python code inside the browser sandbox; it does **not** install native Android/Linux binaries.

## Important browser limitation

A GitHub Pages website cannot execute arbitrary Android/Linux commands or write to protected phone directories. NEXUS therefore uses genuine browser capabilities wherever the browser exposes them, and a persistent sandbox for its own filesystem/package environment. It never claims a virtual operation changed the Android system.

## GitHub Pages

Upload/replace all four project files together:

- `index.html`
- `style.css`
- `script.js`
- `README.md`

Do not upload the ZIP as a replacement for the four files.
