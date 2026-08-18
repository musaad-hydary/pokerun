# PokéRun

A Pokédex quiz game built on a 320x180 pixel canvas. Guess Pokémon from their image, silhouette, Pokédex number, or just their cry. Compete against a timer, manage lives, and share your results.

## Features

- **4 display modes** — full image, silhouette, number only, or cry only
- **2 answer modes** — multiple choice or typed
- **Daily Challenge** — one shared run per day, same Pokémon for everyone, results shareable as a sticker
- **Generations and type filters** — narrow the pool or go all 1025
- **Seasonal backgrounds** — environment changes with the real-world season
- **Animated sprites** — toggleable via the options tab

## Running locally

```bash
pip install flask requests
python app.py
```

Then open `http://localhost:8765`.

Pokemon data is fetched from [PokéAPI](https://pokeapi.co) and cached locally in a `cache/` folder so repeat runs are fast and offline-capable after the first load.

## Tech stack

- **Backend** — Python + Flask, one file (`app.py`). Serves the HTML and proxies PokéAPI with local JSON caching.
- **Frontend** — Vanilla JS, no build step. Canvas 2D at 320x180 virtual resolution scaled up via CSS. Press Start 2P pixel font.
- **Daily system** — date-seeded shuffle on the server so everyone gets the same 6 Pokémon. One-shot enforced in localStorage.
- **Share sticker** — generated client-side on a Canvas element, downloaded as a PNG.

## Deploying to Vercel

Push to GitHub, import the repo on [vercel.com](https://vercel.com), and deploy. The `vercel.json` is already configured. On Vercel the cache writes to `/tmp` instead of `./cache` since the serverless filesystem is read-only.

## Project structure

```
app.py           Flask backend and API routes
templates/
  index.html     Single-page app shell
static/
  css/style.css
  js/
    main.js      Menu wiring, game start, daily logic
    game.js      Core quiz engine
    share.js     Share sticker canvas generation
```
