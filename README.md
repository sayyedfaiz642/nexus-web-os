# NEXUS — Ultimate Edition

NEXUS is an original browser-based interactive environment designed for GitHub Pages. It uses four files only: `index.html`, `style.css`, `script.js`, and `README.md`.

## Console

The built-in console uses Unix-style command names and a persistent virtual filesystem. Package state and files are stored in browser local storage.

Examples:

```text
pkg update
pkg upgrade
pkg install python nodejs git nano
pkg list-installed
mkdir projects
cd projects
echo Hello > hello.txt
cat hello.txt
python -c "print('Hello from NEXUS')"
node -e "console.log(25*4)"
```

Other commands include `ls`, `pwd`, `cd`, `mkdir`, `touch`, `cat`, `rm`, `cp`, `mv`, `tree`, `echo`, `calc`, `history`, `ping`, `scan`, `neofetch`, `status`, `mkapp`, `apps`, `matrix`, `theme`, `game`, and `lab`.

## Important technical limit

This is an original browser implementation, not a copy of another terminal application. GitHub Pages cannot execute native Android/Linux binaries, install real system packages into the phone, or access the device filesystem from a normal web page. Therefore package operations and runtimes are implemented inside the NEXUS browser sandbox. The commands still have persistent state and useful behavior inside that environment.

## Arena

NEXUS Arena is a real canvas survival game with movement, aiming, shooting, enemies, waves, HP, pickups, particles, score and mobile controls.

## Deploy

Upload/replace all four files together in the GitHub Pages repository. Do not upload the ZIP as a replacement for the four source files.
