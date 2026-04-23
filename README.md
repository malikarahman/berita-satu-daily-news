# Berita Satu Daily News

Internal newsroom dashboard for generated daily weather news articles. The app starts with BMKG weather ingestion, Indonesian article drafting, and an editorial approval workflow. It intentionally stops before CMS publishing so editors can review and approve drafts first.

## Architecture Overview

- **Frontend**: Next.js App Router dashboard in `src/app` and `src/components`.
- **Backend**: Next.js API routes for articles, manual runs, scheduled-run testing, and BMKG previews.
- **Database**: Neon Postgres with Prisma ORM.
- **Weather ingestion**: `src/lib/bmkg` fetches BMKG open forecast JSON and normalizes it into an internal weather object.
- **Article generation**: `src/lib/articles` selects Template 1, 2, or 3, then generates Indonesian online-news-style copy.
- **Scheduling**: `node-cron` job in `src/lib/scheduler/dailyWeatherJob.ts`; use `npm run schedule` for a standalone scheduler process or enable `SCHEDULE_ENABLED=true` for app startup.
- **Future extensibility**: BMKG, templates, scheduler, API, and database layers are separated so Google Docs/CMS/RBAC/analytics can be added later.

## Folder Structure

```text
berita-satu-daily-news/
  prisma/
    schema.prisma
    seed.ts
  scripts/
    scheduler.ts
  src/
    app/
      api/
        articles/
        bmkg/
      globals.css
      layout.tsx
      page.tsx
    components/
      ArticleDashboard.tsx
    lib/
      articles/
        date.ts
        generator.ts
        service.ts
        templateSelector.ts
        types.ts
      bmkg/
        fallback.ts
        fetcher.ts
        locations.ts
      db/
        prisma.ts
      scheduler/
        dailyWeatherJob.ts
    instrumentation.ts
  .env.example
  README.md
```

## Database Schema

Core tables:

- `articles`: source metadata, category, location/date, generated title/body/preview, normalized weather JSON, run type, trigger identity, generation time, requested publish time, status, editor, notes, timestamps.
- `activity_logs`: article workflow history with action, previous/new status, actor, note, timestamp.
- `users`: local mock editor identities.
- `system_logs`: operational error log for API, BMKG, and scheduler failures.

Allowed statuses:

- `Generated`
- `Pending Review`
- `Approved`
- `Revision Needed`
- `Rejected`

New manual and scheduled articles default to `Pending Review`.

## BMKG Ingestion Approach

The source layer uses BMKG open weather data:

- Public weather site: `https://cuaca.bmkg.go.id/`
- JSON forecast endpoint: `https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4={kode_wilayah_tingkat_iv}`

The adapter in `src/lib/bmkg/fetcher.ts`:

1. Loads configured locations and representative `adm4` area codes from `locations.ts`.
2. Fetches BMKG forecasts per area.
3. Normalizes weather into:

```json
{
  "source": "BMKG",
  "source_url": "https://cuaca.bmkg.go.id/",
  "location": "Tangerang Selatan",
  "date": "2026-04-22",
  "day_name": "Rabu",
  "main_condition": "hujan ringan hingga sedang",
  "temperature_min": 24,
  "temperature_max": 33,
  "humidity_min": 69,
  "humidity_max": 96,
  "areas": [],
  "time_segments": []
}
```

If BMKG/network access fails, the app stores a warning and uses fallback sample weather so local workflows remain testable.

## UI Layout Plan

- Top navbar with product name.
- Summary cards for today, pending review, approved, revision needed, and rejected.
- Search and filters for date, location, status, run type, and editor.
- Article table with all required workflow columns.
- Prominent `Run Article` modal.
- Right-side article detail panel with preview, generated body, source link, status/editor/notes controls, editorial action buttons, and activity log.

## Local Setup

```bash
cd /Users/malika/Documents/Playground/berita-satu-daily-news
# copy .env.example to .env and paste your Neon pooled/direct URLs
npm run setup
npm run dev
```

Open `http://localhost:3000`.

The setup command copies `.env.example` to `.env` if needed, installs dependencies, generates Prisma Client, applies the checked-in Postgres migration, and seeds your Neon database.

## Neon Setup

1. Create a Neon project and database.
2. Copy two connection strings from Neon:
   - pooled connection string for app runtime
   - direct connection string for Prisma migrations
3. Put them in `.env`:

```env
DATABASE_URL="postgresql://...pooler.../neondb?sslmode=require&channel_binding=require&pgbouncer=true"
DIRECT_URL="postgresql://...direct-host.../neondb?sslmode=require&channel_binding=require"
```

4. Run:

```bash
npm run prisma:migrate
npm run db:seed
```

For Vercel, add the same `DATABASE_URL` and `DIRECT_URL` in Project Settings -> Environment Variables, then redeploy.

## Manual Run Article Flow

1. Click `Run Article`.
2. Choose category, location, BMKG data source, publish date/time, template preference, editor, and notes.
3. Submit the form.
4. The server fetches latest BMKG data, normalizes it, selects or applies the requested template, creates the Indonesian draft, saves it, and logs the activity.
5. The new article appears immediately with status `Pending Review` and run type `Manual`.

## Scheduled Job Flow

Default behavior:

- Run time: `05:00`
- Intended publish time: `07:00`
- Locations: `Jakarta,Tangerang Selatan,Depok,Bekasi,Bogor`

Run a standalone scheduler:

```bash
SCHEDULE_ENABLED=true npm run schedule
```

Trigger the scheduled workflow manually from the dashboard with `Test Scheduled Run`, or call:

```bash
curl -X POST http://localhost:3000/api/articles/scheduled-run \
  -H "Content-Type: application/json" \
  -d '{"actorName":"System Test"}'
```

## API Routes

- `GET /api/articles`: list articles with filters.
- `GET /api/articles/:id`: article detail.
- `PATCH /api/articles/:id`: update status, notes, or assigned editor.
- `POST /api/articles/run`: manual on-demand article generation.
- `POST /api/articles/scheduled-run`: test scheduled article generation.
- `GET /api/bmkg?location=Jakarta`: fetch and normalize BMKG data.

## Seed Data

The seed file creates:

- `[CUACA] Jakarta - 22 April 2026`
- `[CUACA] Tangerang Selatan - 22 April 2026`
- `[CUACA] Depok - 22 April 2026`
- `[CUACA] Bekasi - 22 April 2026`
- `[CUACA] Bogor - 22 April 2026`

Seeded statuses include `Pending Review`, `Approved`, and `Revision Needed`. Seeded run types include `Scheduled` and `Manual`.

## Notes

- If `DATABASE_URL` is missing or still points to the old `file:...` SQLite style, the app falls back to in-memory demo article data instead of crashing.
- For real persistence on localhost and Vercel, use Neon URLs in `.env` and Vercel environment settings.
