# Deploying ProjectForge

Two pieces: the **website** (Vercel) and the **API with its database** (Railway). Render does the same job as Railway; use one of them for the API, not both.

```
Browser ──► Vercel (frontend)  ──/api/*──►  Railway (API) ──► Railway Postgres
```

The website forwards everything under `/api` to the API. The browser therefore only ever talks to the website's address, so the sign-in cookie is a normal first-party cookie. This matters on phones: Safari and many Android browsers block cookies set by a different domain.

## 1. API and database on Railway

1. New project → **Deploy from GitHub repo** → pick this repo. In the service settings set **Root Directory** to `backend`. `backend/railway.json` supplies the build, start and health-check commands.
2. In the same project add **Database → PostgreSQL**.
3. On the API service, open **Variables** and add:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (Railway reference to the database) |
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | your Vercel address, e.g. `https://projectforge.vercel.app` |
| `TRUST_PROXY` | `1` |
| `RESEND_API_KEY` | from resend.com (password-reset email) |
| `MAIL_FROM` | e.g. `ProjectForge <noreply@your-domain.com>` (a verified sender in Resend) |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | from your Cloudinary dashboard; figure images are stored there (up to 8 MB each). Leave out to keep them in the database. |
| `ADMIN_EMAILS` | your own email (comma-separate more). Those accounts see **Admin** in the app header and can open `/admin`. |
| `ANTHROPIC_API_KEY` | optional; leave out to keep the writing coach switched off |

4. **Settings → Networking → Generate Domain.** Note the address, e.g. `https://projectforge-api.up.railway.app`.
5. Deploy. Each start runs `prisma migrate deploy` (creates or updates the tables) and then starts the server. Open `<api address>/api/health`; it should answer `{"success":true,...}`.

## 1b. Or: API on Render and database on Neon (free)

Use this instead of section 1 if you want to stay on free plans. Do not use both.

1. **Neon:** create a project at neon.tech and copy the connection string (`postgresql://…?sslmode=require`). This is your `DATABASE_URL`.
2. **Render:** **New → Web Service**, pick this repository, then set:
   - **Root Directory:** `backend`
   - **Runtime:** Node
   - **Build Command:** `npm ci --include=dev && npm run build`
   - **Start Command:** `npm run start:prod`
   - **Health Check Path:** `/api/health`
   - **Instance Type:** Free
3. Add the same variables as in section 1, with `DATABASE_URL` set to the Neon string. Add `TRUST_PROXY=1`.
4. Copy the Render address (`https://something.onrender.com`). It is your `API_ORIGIN` on Vercel (section 2).

On the free plan Render puts the server to sleep when idle, so the first visit after a quiet period can take up to a minute. A restart during a deploy causes a gap of a minute or two. Deploy at a quiet time.

## 2. Website on Vercel

1. **Add New → Project** → import this repo. Set **Root Directory** to `frontend`. The framework is detected as Next.js.
2. Add environment variables:

| Variable | Value |
| --- | --- |
| `API_ORIGIN` | the Railway address from step 4 above (no trailing slash) |
| `SESSION_COOKIE_NAME` | leave out unless you changed it on the API |
| `ADMIN_SLUG` | a long secret word such as `desk-7f3k9q2m` (8 to 60 letters, numbers, `-` or `_`). Your admin page is then at `https://your-site/desk-7f3k9q2m`, and `/admin` does not exist. Never link to it. Set it before the build (changing it means redeploying). |
| `NEXT_PUBLIC_CONTACT_EMAIL` | the email shown on the privacy page for data requests |

3. Deploy. `FRONTEND_URL` on Railway must equal the final Vercel address (if you add a custom domain, update it and redeploy the API).

## 3. Check it

- Sign up on the website, then confirm you stay signed in after a refresh (on a phone too).
- **Forgot your password?** → the email arrives and the link works once.
- Create a project, write something, and export a Word file.

## Things to know

- **Create your own account before you set `ADMIN_EMAILS`.** Emails are not verified at sign-up, so whoever registers an address first owns it. Sign up with the email you will use as administrator, then add it to `ADMIN_EMAILS`.

- **Email:** until a sender domain is verified in Resend, it only delivers to your own address (`onboarding@resend.dev`). Verify a domain before inviting students.
- **Backups:** turn on Railway's Postgres backups. Students' reports live there.
- **Sign-in limit:** sign-in and sign-up allow 10 tries per 15 minutes per address. `TRUST_PROXY` must be set or every student shares one address and can lock each other out.
- **Long requests:** the writing coach can take a while; the website's forwarding allows up to two minutes.
- **First deploy order:** deploy Railway first (you need its address), then Vercel, then set `FRONTEND_URL` and redeploy the API if the Vercel address changed.
