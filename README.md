# Todosday

Aplikasi todo list sederhana dengan akun user: setiap user hanya melihat todo miliknya.
Frontend di-deploy ke **Vercel**, backend ke **VPS** sebagai container Docker, dan semuanya
otomatis lewat **GitHub Actions** setiap kali ada push ke `main`.

## Arsitektur

```
Browser ──HTTPS──► Vercel   apps/web   (Next.js)
                      │  REST + JSON, header Authorization: Bearer <JWT>
                      ▼
                   VPS       Caddy     (HTTPS, sertifikat Let's Encrypt otomatis)
                               └─► api (apps/api, NestJS) ──► postgres
```

## Struktur repo

```
todosday/
├── apps/
│   ├── web/        Next.js → Vercel
│   └── api/        NestJS + Prisma → VPS (Dockerfile di sini)
├── packages/
│   └── shared/     Tipe & skema zod yang dipakai web dan api
├── .github/workflows/
│   ├── web.yml     CI frontend
│   └── api.yml     CI/CD backend
├── docker-compose.yml   Dijalankan di VPS (postgres, api, caddy)
├── Caddyfile            Konfigurasi reverse proxy + HTTPS
└── .env.example         Contoh env untuk docker-compose
```

## Menjalankan di lokal

Prasyarat: Node.js 22+, pnpm 12, Docker (untuk Postgres).

```bash
pnpm install
cp .env.example .env                      # untuk docker-compose
cp apps/api/.env.example apps/api/.env    # untuk backend
docker compose up -d postgres
pnpm --filter @todosday/api db:migrate    # terapkan migrasi ke DB lokal
pnpm dev
```

- Web: http://localhost:3000
- API: http://localhost:3001 (cek dengan http://localhost:3001/health)

Nilai bawaan `.env.example` langsung bisa dipakai untuk lokal. Jangan pakai nilai yang sama di VPS.

Frontend membaca alamat API dari `NEXT_PUBLIC_API_URL` (di `apps/web/.env.local`).
Jika tidak diisi, fallback-nya `http://localhost:3001`.

### Perintah

| Perintah | Kegunaan |
| --- | --- |
| `pnpm dev` | Menjalankan web, api, dan shared (mode watch) sekaligus |
| `pnpm build` | Build semua workspace |
| `pnpm lint` | Lint semua workspace |
| `pnpm test` | Unit test api |
| `pnpm test:e2e` | E2E test api (butuh Postgres lokal yang sudah dimigrasi) |
| `pnpm --filter @todosday/api db:migrate` | Membuat dan menerapkan migrasi baru saat development |

### Environment variable

Backend (`apps/api/.env`):

| Variabel | Wajib | Keterangan |
| --- | --- | --- |
| `DATABASE_URL` | ya | Koneksi PostgreSQL |
| `JWT_SECRET` | ya | Minimal 16 karakter |
| `PORT` | tidak | Default `3001`; di container `3000` |
| `CORS_ORIGIN` | di production | Origin yang diizinkan, dipisah koma. Kosong = semua origin diizinkan (hanya untuk development) |

Frontend: `NEXT_PUBLIC_API_URL`, contoh `https://api.domainmu.com`.

Root (`.env`, dipakai `docker-compose.yml`):

| Variabel | Keterangan |
| --- | --- |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | Kredensial database. `DATABASE_URL` harus memakai user/password yang sama |
| `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN` | Diteruskan ke container api |
| `GHCR_OWNER` | Username GitHub (huruf kecil) pemilik image |
| `IMAGE_TAG` | Tag image. Diisi CI dengan commit SHA; default `latest` |

## Alur kerja dan CI/CD

```
feature/xyz ──► Pull Request ──► CI (lint, test, build) ──► merge ke main
                                                              ├─► Vercel: deploy otomatis
                                                              └─► api.yml: build image ─► push ke GHCR ─► deploy ke VPS
```

**`web.yml`** hanya menjalankan lint dan build. Deploy frontend dilakukan Vercel lewat integrasi Git.

**`api.yml`** punya tiga job dan hanya berjalan jika ada perubahan di `apps/api`, `packages/shared`, atau lockfile:

| Job | Kapan | Isi |
| --- | --- | --- |
| `ci` | PR dan push ke main | Lint, unit test, e2e (dengan Postgres sebagai service), build |
| `build-and-push` | Hanya push ke main | Build image Docker, push ke `ghcr.io/<owner>/todosday-api:<sha>` dan `:latest` |
| `deploy` | Hanya push ke main | SSH ke VPS: pull image, `prisma migrate deploy`, lalu `docker compose up -d` |

Job `deploy` memakai `concurrency: deploy-api`, jadi dua deploy tidak pernah berjalan bersamaan.

## Setup deploy

### 1. GitHub

Buat repo, push proyek ini, lalu tambahkan tiga **Actions secrets** (Settings → Secrets and variables → Actions):

| Secret | Isi |
| --- | --- |
| `VPS_HOST` | IP atau hostname VPS |
| `VPS_USER` | User untuk login SSH |
| `VPS_SSH_KEY` | Private key SSH (public key-nya ada di `~/.ssh/authorized_keys` di VPS) |

`GITHUB_TOKEN` untuk push/pull image sudah disediakan GitHub otomatis, tidak perlu dibuat.

### 2. VPS

Prasyarat: Docker dengan plugin Compose, port 80 dan 443 terbuka, dan domain yang A record-nya mengarah ke IP VPS.

```bash
mkdir -p /srv/todosday && cd /srv/todosday
# salin docker-compose.yml, Caddyfile, dan .env.example (jadi .env) dari repo ini

nano .env        # POSTGRES_PASSWORD, DATABASE_URL, JWT_SECRET, CORS_ORIGIN, GHCR_OWNER
nano Caddyfile   # ganti api.example.com dengan domain API
docker compose up -d postgres
```

`caddy` dan `api` dinyalakan otomatis oleh deploy pertama dari CI, jadi tidak perlu dijalankan manual.
Sampai secrets terisi dan image pertama terbit, job `deploy` memang akan gagal. Job `ci` dan `build-and-push` tetap jalan.

Setelah deploy pertama, cek `https://api.domainmu.com/health`. Harus mengembalikan `{"status":"ok"}`.

Catatan:

- `docker-compose.yml` dan `Caddyfile` di VPS adalah salinan. Kalau file itu berubah di repo, salin ulang ke VPS.
- Untuk repo privat, CI sudah login ke GHCR sendiri saat deploy. `docker login ghcr.io` manual di VPS hanya perlu untuk pull di luar CI (pakai PAT dengan scope `read:packages`).

### 3. Vercel

1. **Add New Project** → import repo → Framework Preset **Next.js**.
2. Isi **Root Directory** dengan `apps/web`.
3. Tambahkan environment variable `NEXT_PUBLIC_API_URL=https://api.domainmu.com`.
4. **Settings → Git → Ignored Build Step**: pilih **Automatic** kalau tersedia. Vercel lalu melewati build jika tidak ada perubahan di `apps/web` maupun di dependency internalnya (`packages/shared`).
5. Kalau memakai **Custom Command** sebagai gantinya:

   ```bash
   git diff HEAD^ HEAD --quiet -- . ../../packages/shared ../../pnpm-lock.yaml
   ```

   Perintah ini dijalankan di dalam `apps/web`. Exit 0 berarti build dilewati.

Dengan `git diff HEAD^`, Vercel hanya membandingkan commit terakhir. Kalau satu push berisi beberapa commit dan perubahan frontend ada di commit yang bukan terakhir, build frontend bisa terlewat.

## Catatan teknis

- **Autentikasi:** password di-hash dengan bcrypt. Token JWT berlaku 7 hari dan disimpan frontend di `localStorage`.
- **Isolasi data:** semua endpoint `/todos` mengambil `userId` dari token, bukan dari request. Todo milik user lain menghasilkan 404.
- **Validasi:** skema zod di `packages/shared` dipakai backend (`ZodValidationPipe`) dan frontend, jadi aturannya sama di kedua sisi.
- **Image Docker:** sekitar 617 MB. Untuk repo privat, image di GitHub Packages masuk kuota gratis akun (sekitar 500 MB).
