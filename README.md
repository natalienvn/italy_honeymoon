# Trip Planning

A home page of folders — one per family or group (e.g. "Natalie and
Tristan") — and inside each folder, all the trips being planned for that
group. Inside each trip: flights, a day-by-day itinerary, notes grouped by
destination, and trackers for hotels, restaurants, and experiences. Add as
many folders and trips as you want — Italy comes pre-loaded under "Natalie
and Tristan" with what was already planned there.

## Local development

```bash
npm install
npm run dev
```

This starts the site at `http://localhost:5173`. Everything works locally
**except** the "Organize" button (Itinerary tab) and the "Import" tab, since
both call serverless functions that only run on Vercel — see below if you
want to test those locally too.

## Deploy to Vercel

1. Push this folder to a new GitHub repo.
2. Go to [vercel.com/new](https://vercel.com/new) and import that repo.
   Vercel auto-detects the Vite framework — no config needed.
3. Before the first deploy (or any time after, under **Settings → Environment
   Variables**), add:
   - `ANTHROPIC_API_KEY` — your API key from
     [console.anthropic.com](https://console.anthropic.com)
4. Deploy. Your site will be live at `your-project.vercel.app`.

If you add or change the environment variable *after* deploying once, you
need to trigger a new deploy (e.g. push another commit) for it to take
effect — Vercel doesn't pick up env var changes on already-built deployments.

### Testing "Organize" / "Import" locally

The `/api` folder only runs on Vercel's servers, not with `npm run dev`. To
test it locally too:

```bash
npm install -g vercel
vercel dev
```

and add your key to a local `.env` file first (copy `.env.example` to `.env`
and fill it in).

## Destinations

Each trip has its own list of destinations (e.g. Rome, Tuscany, Florence for
the Italy trip) — add, rename, or remove them from the pill row near the top
of a trip. Notes, bookings, and days can all be tagged to a destination, plus
two built-in groups that are always there: **General** (trip-wide notes not
tied to one place) and **Travel** (for transit days, like a flight day).

## Day structure

Each day breaks down into editable sections \u2014 Hotel, Restaurants,
Experiences, Sights, and Travel by default \u2014 and you can rename, delete, or
add your own (click "+ Add section"). Every entry in a section has its own
time field plus a details field, so you get real per-day timing instead of
one big note.

There's still a quick brain-dump box on each day: type freely, hit "Organize
into sections," and Claude sorts what you wrote into the right sections
automatically (matching whatever sections that day actually has, including
ones you've renamed or added). Anything it can't place lands in a "Notes"
section instead of getting lost.

## Suggestions & chat

On the Itinerary tab, the **Suggestions** button opens a panel that reads
your whole trip \u2014 destinations, every day's plan, and everything already
booked \u2014 and can search the web broadly (review sites, travel blogs,
Reddit threads, wherever) to point out gaps and suggest real options for
them. You can also just type a question instead of running the full review
("what's a good day trip from Siena?"), and keep chatting with follow-ups \u2014
it remembers the conversation as you go.

Same cost note as Search & compare above: this uses live web search through
your `ANTHROPIC_API_KEY`, only when you actually open the panel and send
something.

## Searching & comparing options

Inside Hotels, Restaurants, Experiences, or any custom booking category, each
destination group has a "Search & compare" toggle. Type something like
"boutique hotels near the Duomo under $250/night" and Claude searches the web
and returns a short list with price range, rating, a summary, and pros/cons
pulled from what it actually finds \u2014 nothing invented. Click "Add" on any
result to drop it straight into that category, pre-filled.

This uses live web search through the Anthropic API (the same
`ANTHROPIC_API_KEY` as everything else), which may have a small per-search
cost on your Anthropic account depending on your plan \u2014 check
[Anthropic's pricing](https://www.anthropic.com/pricing) if that matters to
you. It's not called unless you actually run a search.

## Importing existing bookings

The **Import** tab (inside a trip) lets you paste text or upload a file, and
Claude pulls out flights, hotels, restaurants, and experiences into a review
list — nothing gets added until you check it over and click "Add." It
automatically matches destinations to whatever you've set up for that
specific trip.

Supported file types: **PDF, Word (.docx), images (PNG/JPG), and plain text
(.txt/.md)**. Anything else (Excel, Pages, Numbers, email export files, etc.)
isn't supported directly — copy the relevant text out and paste it into the
text box instead, which works for basically anything you can select and copy.

## Saving

Everything (all your trips) is saved to your browser's `localStorage` — no
account or database needed. It saves automatically about half a second after
you stop typing, **and** it force-saves the moment you close the tab,
refresh, or switch away, so nothing you've typed is ever lost in a normal
browser session.

**Important caveat:** this only works if your browser actually keeps
`localStorage` around. If you're in a private/incognito window, or your
browser is set to clear cookies and site data on close (common in Safari,
Brave, and privacy-hardened Chrome/Firefox setups), everything gets wiped the
moment you close the window — no code can prevent that, since the browser
itself is deleting the storage.

To protect against that, there are **Export backup** / **Import backup**
buttons at the top of the app (works from the home page or inside a trip —
it backs up everything, all trips at once). If the app ever shows a red
"changes aren't saving" banner, export a backup right away.

It's also worth knowing storage is per-browser, per-device — it won't follow
you to a different browser or computer. Use Export if you want to move your
data somewhere else, or just to be safe.

## Stack

Vite + React + Tailwind CSS + lucide-react icons, with two Vercel serverless
functions: `/api/organize` (turns a day's rough notes into a clean
itinerary) and `/api/import` (pulls structured bookings out of pasted text
or an uploaded document).
