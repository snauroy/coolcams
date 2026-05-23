# CoolCams

A curated film camera discovery site. Browse iconic film cameras, read detailed specs and character notes, and see photos taken with each one.

## Stack
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Flickr API + Wikimedia Commons (images)

## Design
- Minimalist, modern, brutalist aesthetic
- Light background, stark typography, raw grid layouts
- No decorative elements — let the cameras and photos speak
- Language: English

## Scope
- Film cameras only (no digital)
- 50 curated cameras (see `/data/cameras.json`)
- Product photos from Wikimedia Commons
- Sample photos from Flickr API (tagged by camera model)

## Data
All camera data lives in `/data/cameras.json`.

Each camera has:
- `id`, `name`, `brand`, `category`, `format`, `years`
- `lens` (focal, aperture, maker) — for cameras with fixed lenses
- `specs` (shutter speeds, metering, focus, film speeds)
- `vibe` — character description, rendering qualities
- `bestFor` — array of use cases (street, portrait, travel...)
- `culturalNote` — notable users, historical context
- `marketPrice` — approximate used market price (EUR)
- `difficulty` — beginner / intermediate / advanced
- `wikiImage` — Wikimedia Commons image filename (to be populated)

## Categories
- `compact` — point & shoot compacts
- `rangefinder` — rangefinder cameras
- `slr` — 35mm SLRs
- `medium-format` — medium format cameras
- `toy` — toy / lo-fi cameras

## Phases
- [x] Phase 0 — Dev setup + Git
- [x] Phase 1 — CLAUDE.md + camera data JSON
- [ ] Phase 2 — UI shell (layout, navigation, filters, camera grid)
- [ ] Phase 3 — Camera detail page
- [ ] Phase 4 — Wikimedia product photos
- [ ] Phase 5 — Flickr sample photos integration
- [ ] Phase 6 — Polish (typography, animations, mobile)

## Commands
```bash
npm run dev     # start dev server on localhost:3000
npm run build   # production build
npm run lint    # lint
```
