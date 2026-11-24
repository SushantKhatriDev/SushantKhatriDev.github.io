```markdown
# Sushant Khatri // Interstellar Nav Deck

Interactive navigation deck for `SushantKhatriDev.github.io`, built with HTML, CSS, and vanilla JavaScript.

## Directory Structure

```text
.
├── assets
│   ├── audio
│   ├── css
│   │   ├── style.css
│   │   └── welcome.css
│   ├── img
│   │   └── favicon.svg
│   └── js
│       ├── app.js
│       ├── audio-gate.js
│       └── data.js
├── index.html
└── README.md

```

## Overview & Modules

* **`index.html`** — Entry page markup, welcome modal gate, HUD console, hub switcher, navigation links, and audio controls.
* **`assets/css/style.css`** — Core dark-space deck layout, scanlines, HUD panel, hub tabs, navigation buttons, and audio controls.
* **`assets/css/welcome.css`** — Full-screen welcome overlay and transition styling.
* **`assets/img/favicon.svg`** — Custom vector tab icon.
* **`assets/js/data.js`** — Centralized configuration for site branding, YouTube track ID, boot sequence logs, ecosystem hubs (**Runexel**, **Sutomiuxe**, **NexusFrag**), and external links.
* **`assets/js/audio-gate.js`** — Handles welcome gate unlock, Web Audio API synth chimes and UI beeps, mute/unmute state, and YouTube IFrame API background playback.
* **`assets/js/app.js`** — Runs the rhythmic canvas starfield engine (`SURGE`, `CRUISE`, `DRIFT`, `STILL`, `RUSH`), live grid coordinate tracker, boot log sequence, hub selector, and link hover/click effects.
* **`assets/audio/`** — Reserved directory for local audio assets.

## Local Preview

Start a local server from the project root so the YouTube IFrame API runs properly over HTTP:

```bash
python3 -m http.server 8000

```

Open `http://localhost:8000` in your browser.

## Deployment

Hosted on **GitHub Pages** at `https://SushantKhatriDev.github.io`. Stage, commit, and push changes to the main branch to publish updates.

```

<FollowUp label="Want the final git add, commit, and push commands?" query="Show the exact git commands to commit README.md and push the entire project to GitHub Pages."/>

```
