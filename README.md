# Berita Satu: Cuaca Hari Ini

Dashboard internal untuk BeritaSatu yang membuat, menampilkan, dan mereview draft artikel cuaca berbasis BMKG.

## Ringkasan

Versi terbaru memakai dua mode generation:

- `Run Article` untuk custom generation berdasarkan cakupan yang dipilih editor
- `Automated Generate Articles` untuk batch generation manual sekali klik

Sistem **tidak lagi berjalan otomatis pada pukul 05:00 WIB**. Cron aktif dinonaktifkan dan alurnya sudah diubah menjadi manual batch trigger dari dashboard atau API.

## Fitur utama

- Dashboard artikel dengan filter, search, dan summary cards
- Sidebar collapsible agar tabel artikel lebih lebar
- `Run Article` dengan cakupan:
  - Single Region
  - Multiple Publication Areas
  - Multiple Regions
  - All Region: Jabodetabek
- `Automated Generate Articles` untuk batch:
  - Jakarta
  - Bogor
  - Depok
  - Tangerang
  - Bekasi
  - Jabodetabek
- Article detail / View Draft dengan:
  - editable generated article body
  - Save Changes
  - copy selected text
  - status update
  - editor assignment
  - Catatan Redaksi
  - Catatan
- Documentation page
- Logs page

## Shared pipeline

Semua mode generation memakai pipeline yang sama:

`location selection resolver -> BMKG fetcher -> BMKG normalizer -> aggregator -> template selector -> article generator -> database save -> activity log`

## Tech stack

- Next.js App Router
- TypeScript
- Prisma
- SQLite untuk lokal, Postgres/Neon untuk deployment Vercel
- Tailwind CSS

## Struktur penting

- `src/components/ArticleDashboard.tsx` - dashboard utama, Run Article, Automated Generate Articles, View Draft
- `src/components/DocumentationPage.tsx` - halaman dokumentasi internal
- `src/components/LogPage.tsx` - halaman log
- `src/components/layout/AppShell.tsx` - shell + sidebar collapsible
- `src/data/coverageGroups.ts` - region groups dan publication area editorial
- `src/data/locationGroups.ts` - lokasi BMKG representatif internal
- `src/lib/bmkg/fetcher.ts` - fetch + normalize + aggregate BMKG
- `src/lib/articles/templateSelector.ts` - pemilihan template
- `src/lib/articles/generator.ts` - generator judul dan body artikel
- `src/lib/articles/service.ts` - service utama manual run, batch run, workflow update, logs
- `prisma/schema.prisma` - schema database
- `prisma/seed.ts` - seed data

## Setup lokal

```bash
cd /Users/malika/Documents/Playground/berita-satu-daily-news
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate
npm run seed
npm run dev
```

Lalu buka:

- [http://localhost:3000](http://localhost:3000)

## Environment

Default lokal:

```env
DATABASE_URL="file:./beritasatu-cuaca.db"
DEFAULT_EDITOR_NAME="Editor Piket"
BMKG_BASE_URL="https://api.bmkg.go.id/publik/prakiraan-cuaca"
BMKG_SOURCE_URL="https://cuaca.bmkg.go.id/"
SCHEDULE_ENABLED="false"
```

Untuk deployment Vercel, set `DATABASE_URL` ke URL Postgres/Neon. Build script akan otomatis memilih schema Prisma Postgres dan menjalankan `prisma db push` saat build.

## Cara test

### 1. Run Article

1. buka dashboard
2. klik `Run Article`
3. pilih scope generation
4. pilih template jika ingin override
5. klik `Generate Draft`

Hasil:

- artikel baru masuk ke tabel
- `run_type = Manual`
- `status = Pending Review`

### 2. Automated Generate Articles

1. buka dashboard
2. klik `Automated Generate Articles`
3. baca daftar batch target
4. klik `Generate Batch`

Hasil:

- sistem membuat artikel untuk Jakarta, Bogor, Depok, Tangerang, Bekasi, dan Jabodetabek
- `run_type = Automated Manual`
- `status = Pending Review`

Atau lewat API:

```bash
curl -X POST http://localhost:3000/api/articles/automated-generate \
  -H "Content-Type: application/json" \
  -d '{"actorName":"Editor Piket"}'
```

### 3. Edit draft article body

1. klik `View` di tabel artikel
2. edit isi pada bagian `Generated Article Body`
3. sorot teks jika ingin memakai `Copy Selected Text`
4. klik `Save Changes`

Hasil:

- `body_text` tersimpan ke database
- activity log membuat entri `Article Body Edited`

### 4. Update status, editor, dan catatan

Semua aksi bisa dilakukan dari View Draft:

- Approve
- Mark Revision Needed
- Reject
- Assign Editor
- Save `Catatan`

## Halaman penting

- Dashboard: [http://localhost:3000](http://localhost:3000)
- Documentation: [http://localhost:3000/documentation](http://localhost:3000/documentation)
- Logs: [http://localhost:3000/logs](http://localhost:3000/logs)

## API penting

- `GET /api/articles`
- `GET /api/articles/[id]`
- `PATCH /api/articles/[id]`
- `POST /api/articles/manual-generate`
- `POST /api/articles/automated-generate`
- `GET /api/logs`

Kompatibilitas lama tetap ada:

- `POST /api/articles/scheduled-run`
- `POST /api/scheduled/run-test`

Keduanya sekarang memanggil manual batch generation yang sama, bukan cron otomatis.

## Catatan implementasi

- `requested_publish_datetime` masih disimpan internal untuk kompatibilitas, tetapi tidak ditampilkan di UI
- Catatan sistem dipisahkan ke `editorial_notes`
- Catatan editor tetap disimpan di `notes`
- Editor aktif versi ini hanya `Editor Piket`
- Publication area di UI berada di level kota/kabupaten/kota administrasi
- Kelurahan/desa hanya dipakai sebagai sumber BMKG internal

## Keterbatasan saat ini

- BMKG autocomplete publik belum diintegrasikan langsung; cakupan editorial masih memakai konfigurasi internal
- Integrasi Google Docs dan CMS belum diaktifkan
- Versioning body artikel belum ditambahkan; edit draft saat ini langsung memperbarui `body_text`
