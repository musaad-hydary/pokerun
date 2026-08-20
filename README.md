# PokéRun

A Pokédex quiz game built on a 320x180 pixel canvas. Guess Pokémon from their image, silhouette, Pokédex number, or cry.

## Features

**Display modes**
- Image, silhouette, number only, or cry only
- Silhouettes pulse with a white glow so they're readable in dark environments

**Answer modes**
- Multiple choice, typed, true/false, or mixed (random combination of all three per question)

**Daily Challenge**
- One shared run per day, same 6 Pokémon for everyone, seeded by date on the server
- Silhouette + typed + 10s timer + 1 life, seasonal environment
- Results inline on the daily tab with a share button that generates a PNG sticker

**Hint system** (optional, costs points)
- First letter (-50 pts), type reveal (-25 pts), name length (-50 pts)

**Customization**
- Generation filter (Gen I-IX or all 1025)
- Type filter (narrow pool to a single type)
- Lives, timer, question count, and order (random or sequential)
- Shiny chance toggle (1-in-10 odds)
- Animated or still sprites

**Environments (Vibes tab)**
- Grass, cave, city, beach, snow, sand, forest, night, ultra space
- Auto-seasonal: picks the right environment for the current real-world season
- Ultra space has rainbow crystal rocks and a brighter purple sky

**Preferences**
- All settings persist across sessions via localStorage

**Offline support**
- Service worker caches all local assets after the first load

## Running locally

```bash
pip install flask requests
python app.py
```

Open `http://localhost:8765`. PokéAPI data is fetched on demand and cached in `cache/` so repeat runs are fast.

## Tech stack

- **Backend** — Python + Flask (`app.py`). Proxies PokéAPI with local JSON caching. Strips variant suffixes from Pokémon names (e.g. "Darmanitan Standard" becomes "Darmanitan").
- **Frontend** — Vanilla JS, no build step. Canvas 2D at 320x180 virtual resolution scaled via CSS. Press Start 2P pixel font.
- **Daily system** — date-seeded `random.shuffle` on the server so everyone gets the same queue. One-shot enforced in localStorage.
- **Share sticker** — generated client-side on a hidden Canvas, exported as a PNG.
- **Service worker** — cache-first for local assets, network-first for API calls, network-only for external CDN sprites and cries.

## Deploying to Vercel

Push to GitHub, import on vercel.com, and deploy. `vercel.json` is already configured. Cache writes to `/tmp` on Vercel since the serverless filesystem is read-only.

## Project structure

```
app.py              Flask backend and API routes
static/
  sw.js             Service worker
  css/style.css
  js/
    main.js         Menu wiring, tab logic, daily UI, preferences
    game.js         Canvas engine, terrain, encounter system
    quiz.js         Quiz overlay, answer modes, hints, timer
    share.js        Share sticker canvas generation
templates/
  index.html        Single-page app shell
```
