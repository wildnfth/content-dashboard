# Content Dashboard Lia

Migrasi `content-dashboard` dari aplikasi statis menjadi SPA internal berbasis `React + Vite + TypeScript`, dengan fokus pada workflow operasional mobile-first dan tampilan insight yang lebih rapi.

## Stack

- React 19
- Vite 8
- TypeScript
- React Router
- React Query
- Supabase
- Chart.js + react-chartjs-2
- Vitest + Testing Library

## Fitur Utama

- Login internal dengan mapping `username -> @proton.me`
- Route terproteksi untuk `Operasional` dan `Insight`
- CRUD post dengan validasi duplicate `kode_video`
- Penomoran otomatis via `getNextNomor`
- Filter tanggal, prefix/seri, dan periode insight
- Status post belum lengkap dengan hint field yang kurang
- Modal/sheet untuk form post dan viewer link
- Toast feedback
- Chart insight: trend, perbandingan platform, top 5 video, dan breakdown video
- Layout mobile-first dengan desktop table view

## Environment Variables

Buat file `.env` dari `.env.example`.

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## Menjalankan Project

```bash
npm install
npm run dev
```

## Scripts

```bash
npm run dev
npm run build
npm run preview
npm run lint
npm run test
```

## Deploy ke Vercel

Project ini siap deploy sebagai SPA Vite.

- Build command: `npm run build`
- Output directory: `dist`
- SPA rewrite sudah disiapkan di `vercel.json`

## Catatan Migrasi

- Implementasi statis lama disimpan di folder `legacy/` sebagai referensi.
- Schema Supabase dan fitur inti dipertahankan.
