# NEXUS OS

![NEXUS](https://img.shields.io/badge/NEXUS-OS-00ff9d?style=for-the-badge)
![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Ready-222?style=for-the-badge&logo=github)
![Python](https://img.shields.io/badge/Python-Pyodide%20WASM-blue?style=for-the-badge&logo=python)

Original browser-native cyberpunk workstation for GitHub Pages.

## 4 files

| File | Purpose |
|---|---|
| `index.html` | UI |
| `style.css` | Cyberpunk responsive design |
| `script.js` | Terminal, VFS, Python, Nano, Signal Lab and Arena |
| `README.md` | Documentation |

## Install

Put all four files in the **root** of your GitHub repository:

```text
index.html
style.css
script.js
README.md
```

Then enable:

**GitHub → Repository → Settings → Pages → Deploy from branch → main → /root**

No npm, Node, Vite or build step is required.

## Terminal

```text
help
ls
pwd
cd <path>
mkdir <name>
touch <file>
cat <file>
rm <path>
nano <file>
clear
neofetch
history
whoami
date
uname
python
python3
signal
arena
about
theme
reset-vfs
exit
```

## Real Python

Pyodide loads CPython through WebAssembly.

```bash
python -c "print(2 + 3)"
```

```bash
python -c "for i in range(5): print(i)"
```

```bash
python3 -c "print(sum(range(1,101)))"
```

The first Python startup can take a little time because the WebAssembly runtime is downloaded.

## Persistent files

The NEXUS VFS is stored in browser LocalStorage.

Example:

```bash
mkdir myapp
cd myapp
touch hello.txt
nano hello.txt
```

Save with **Ctrl+S**, then:

```bash
cat hello.txt
```

## Important limitation

This GitHub Pages version is still inside the browser sandbox. It cannot execute arbitrary Android/Linux host binaries or install real Termux packages into the device.

Therefore commands such as:

```bash
pkg install python
apt install gcc
sudo
systemctl
```

cannot become real host-OS commands on a static GitHub Pages site.

Architecture:

```text
NEXUS UI
   ↓
NEXUS Shell
   ↓
NEXUS VFS / LocalStorage
   ↓
Browser APIs
   ↓
WebAssembly
   ↓
CPython via Pyodide
```

A true Android/Linux/Kali/VNC environment requires a native runtime outside GitHub Pages.

## Arena

Desktop:
- WASD / arrow keys = movement
- mouse = aim
- mouse button = fire

Mobile:
- joystick = movement
- FIRE = shooting

## Signal Lab

Live Canvas waveform with intensity and speed controls.

## Technology

| Technology | Use |
|---|---|
| HTML5 | UI |
| CSS3 | Styling |
| JavaScript ES6+ | Runtime |
| LocalStorage | VFS |
| Canvas | Graphics |
| WebAssembly | Python |
| Pyodide | CPython |
| GitHub Pages | Hosting |

## First test

```bash
pwd
```

```bash
ls
```

```bash
python -c "print('NEXUS PYTHON WORKING')"
```

```bash
mkdir test
```

```bash
cd test
```

```bash
touch hello.txt
```

```bash
nano hello.txt
```

Save text and run:

```bash
cat hello.txt
```

## Reset

```bash
reset-vfs
```

This resets the browser-stored NEXUS filesystem.
