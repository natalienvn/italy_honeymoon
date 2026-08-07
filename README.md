# Rome · Tuscany · Florence — Trip Planner

A fully editable trip planner: flights, a day-by-day itinerary, region-grouped
notes, and trackers for hotels, restaurants, and experiences. Everything you
type is saved to your browser automatically (see **Saving** below).

## Local development

```bash
npm install
npm run dev
```

This starts the site at `http://localhost:5173`. Everything works locally
**except** the "Organize" button on the Itinerary tab, which calls a
serverless function (`/api/organize`) that only runs on Vercel — see below
if you want to test it locally too.

## Deploy to Vercel

1. Push this folder to a new GitHub repo.
2. Go to [vercel.com/new](https://vercel.com/new) and import that repo.
   Vercel auto-detects the Vite framework — no config needed.
3. Before the first deploy (or any time after, under **Settings → Environment
   Variables**), add:
   - `ANTHROPIC_API_KEY` — your API key from
     [console.anthropic.com](https://console.anthropic.com)
4. Deploy. Your site will be live at `your-project.vercel.app`.

The "Organize" button (which turns your rough day notes into a clean
itinerary) calls `/api/organize`, a Vercel serverless function in this repo
that uses your API key server-side. Your key is never exposed to the
browser.

### Testing "Organize" locally

The `/api` folder only runs on Vercel's servers, not with `npm run dev`. To
test it locally too:

```bash
npm install -g vercel
vercel dev
```

and add your key to a local `.env` file first (copy `.env.example` to `.env`
and fill it in).

## Saving

Your trip data (flights, days, notes, bookings) is saved to your browser's
`localStorage` — no account or database needed. It's saved automatically
about half a second after you stop typing, **and** it force-saves the moment
you close the tab, refresh, or switch away, so nothing you've typed is ever
lost. It's stored per-browser, on the device you're using — it won't
follow you to a different browser or computer, and clearing your browser
data will clear it too.

## Stack

Vite + React + Tailwind CSS + lucide-react icons, with one Vercel serverless
function for the "Organize" feature.
