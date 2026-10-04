# NEXUS Ultimate Edition

NEXUS is a GitHub Pages friendly interactive web system built with four files.

## What is new

### NEXUS Arena
This is a real playable top-down survival game, not a reaction-time demo.

- Move with WASD
- Aim with mouse/touch
- Hold FIRE to shoot
- Enemy drones and tougher tanks
- Waves
- HP and damage
- Score and best score
- Energy-core pickups
- Particles and effects
- Mobile joystick + FIRE button
- Best score saved in browser localStorage

### NEXUS Terminal
The terminal is a safe browser shell with:

`help`, `ls`, `pwd`, `cd`, `mkdir`, `touch`, `cat`, `rm`, `tree`, `echo`, `clear`, `history`, `whoami`, `date`, `uname`, `neofetch`, `status`, `ping`, `scan`, `matrix`, `calc`, `mkapp`, `apps`, `about`, `lab`, `game`, `theme`, `exit`

### App generator

Try:

`mkapp calculator My Calculator`
`mkapp todo My Tasks`
`mkapp notes My Notes`
`mkapp stopwatch My Timer`
`mkapp quiz My Quiz`

The command generates a standalone HTML app and downloads it to the device/browser downloads.

## Important
The terminal is a browser sandbox. It cannot execute real Linux/Android commands, install packages, scan devices, or access the phone filesystem.

## GitHub Pages installation

Replace all four files in the repository root:

- `index.html`
- `style.css`
- `script.js`
- `README.md`

Commit the changes, wait briefly for GitHub Pages to rebuild, then refresh the site.

Do not upload the ZIP itself as the replacement for the four source files.
