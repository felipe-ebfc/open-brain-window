# Open Brain Window — Product Spec

## What Is This?
A mobile-first Vercel app that gives Felipe a visual "human door" into his Open Brain (Supabase pgvector). Read-only dashboard — all writes go through ingest.ebfc.ai or via Osito (iMessage). This is personal tooling for Felipe + Osito, NOT an EBFC AI product.

## Architecture (Two Doors, One Table)
- **Agent Door**: Osito/Claude/any AI reads and writes Open Brain via MCP (already built)
- **Human Door**: This app — a visual layer over the same Supabase tables
- No sync layer, no middleware. Same rows, same source of truth
- When Osito writes a thought, it shows up next time Felipe opens the app
- Inspired by Nate B. Jones' Open Brain extensions (see transcript.txt)

## Design Principles
- **Mobile first** — designed for iPhone, works on desktop/projector
- **Dark mode** — field-ready, construction-grade aesthetic. Not cute, not startup-y
- **Big touch targets** — scannable in 3 seconds
- **Presentation-ready** — Felipe can pull this up in an ECL session or LCI talk
- **Grows by adding tiles** — each new table = new tile. Architecture scales infinitely

## Layout

### Top 1/3 — "For You" Feed
- Horizontal scrolling cards (Netflix-style, not TikTok vertical)
- Each card = one insight, nudge, or surfaced connection from Open Brain
- Color-coded by source (teal = Atlas, gold = Relationships, white = general)
- Tappable to expand
- Agent-curated: Osito can write "feed items" to a dedicated feed table

### Bottom 2/3 — Tile Grid
- 2-column grid of rounded tiles
- Each tile = one "brain" / data domain
- Each tile shows live count or mini-stat
- Tap to enter full-screen view purpose-built for that data type
- Tiles ordered by data richness (biggest dataset first)

### Tile Order (v1)
1. **Lean Evidence Atlas** — 123+ papers, classified by era (IGLC 29-34), summarized. Visual: era timeline, category filters, search. Can drill into any paper.
2. **Thoughts/Knowledge** — 160+ thoughts in Open Brain. Visual: searchable, categorized, timeline view.
3. **RSM Testimonials** — 179 feedback responses, ranked, analyzed. Visual: filterable quotes, star ratings, session breakdown.
4. **Relationships** — Professional network across Boldt/LCI/EBFC/personal. Visual: contact cards, last interaction, warmth level, world tags. (Needs populating from daily notes + contacts)
5. **LinkedIn Data** — Needs ingesting. Connections, engagement, growth metrics.

### Navigation
- Button to open ingest.ebfc.ai (the intake/ingest page)
- Bottom nav or simple back gestures
- No login required (Supabase anon key + RLS, or simple token auth)

## Tech Stack
- **Frontend**: Next.js or plain React (Vercel-optimized)
- **Database**: Existing Supabase instance (Open Brain)
- **Hosting**: Vercel (free tier, same as other EBFC apps)
- **Deployment**: GitHub repo → Vercel auto-deploy (felipe-ebfc account)

## Supabase Connection
- Same instance as Open Brain (brain-api.ebfc.ai proxies to it)
- Direct Supabase client connection from frontend (anon key + RLS policies)
- Tables: thoughts (existing), atlas papers (existing or needs migration), feed_items (new), relationships (new), testimonials (existing or needs migration)

## What This Is NOT
- Not an EBFC AI product feature
- Not a data input tool (read-only, writes go through ingest.ebfc.ai or Osito)
- Not a replacement for Mission Control (velocity/Trello/process lives there)
- Not a chatbot interface

## Reference
- Video transcript: Nate B. Jones "Open Brain Extensions" (transcript.txt)
- Screenshot: Nate's two-door architecture diagram (nate-open-brain-screenshot.png)
