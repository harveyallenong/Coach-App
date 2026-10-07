# Deploying CoachBook to Vercel + Supabase

This guide puts CoachBook online at `https://<your-project>.vercel.app` so you can open it from your phone. Every step works in a phone browser, though a laptop is easier. It takes about 20 minutes.

You'll set up three things:

| Service | What it does | Cost |
|---|---|---|
| **Vercel** | Hosts the app | Free (Hobby) |
| **Supabase** | The Postgres database, created from inside Vercel | Free tier. The database pauses after a week with no activity; un-pause it from the Supabase dashboard. |
| **Gmail** | Sends the sign-in emails | Free (about 500 emails a day) |

> **Why Gmail and not Resend?** Without your own domain, Resend can only send to your own address, so you couldn't sign in a second test account. Gmail with an app password can send to any address. Switch to Resend once you have a domain (see the end of this guide).

---

## Step 1: Create a Gmail app password

1. Turn on **2-Step Verification** for your Google account (Google Account → Security).
2. Open https://myaccount.google.com/apppasswords, create an app password named `CoachBook`, and copy the 16-character password.

## Step 2: Create a sign-in secret

Open https://generate-secret.vercel.app/32 and copy the value it shows. This is your `AUTH_SECRET`. Keep it private.

## Step 3: Import the project into Vercel

1. Go to https://vercel.com and **sign up with GitHub**, using the account that owns `Coach-App`.
2. Click **Add New… → Project** and **Import** `Coach-App`. Allow Vercel access to the repo if it asks.
3. Leave the framework (Next.js) and the build settings as they are. The repo's `vercel-build` script runs the database migrations automatically.
4. Open **Environment Variables** and add these. Replace `you@gmail.com` with your Gmail address.

   | Name | Value |
   |---|---|
   | `AUTH_SECRET` | the value from Step 2 |
   | `ADMIN_EMAILS` | `you@gmail.com` |
   | `SMTP_HOST` | `smtp.gmail.com` |
   | `SMTP_PORT` | `465` |
   | `SMTP_USER` | `you@gmail.com` |
   | `SMTP_PASSWORD` | the app password from Step 1, without spaces |
   | `EMAIL_FROM` | `CoachBook <you@gmail.com>` |
   | `SEED_ON_DEPLOY` | `true` |
   | `SEED_COACH_EMAIL` | `you@gmail.com` (you become demo coach **Ana Reyes**, with 5 clients) |
   | `SEED_CLIENT_EMAIL` | `you+client@gmail.com` (you become demo client **Bea Lim**; Gmail delivers `+client` mail to your normal inbox) |

5. Click **Deploy**. **This first deploy is expected to fail** with a database error, because there's no database yet.

## Step 4: Add the Supabase database

1. In your Vercel project, open the **Storage** tab, click **Create Database**, choose **Supabase**, and follow the prompts.
   - **Region:** pick **Southeast Asia (Singapore)**. The app runs in Vercel's Singapore region (`vercel.json`), so the database should be next to it.
   - **Environments:** keep Production, Preview and Development all ticked.
2. Click **Connect**. Vercel adds the database settings (`POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING` and others) to your project automatically. You don't need to copy any passwords.

## Step 5: Redeploy

1. Open the **Deployments** tab. On the latest deployment, tap **⋯ → Redeploy**.
2. Wait for it to turn **Ready**, which takes 2–4 minutes. The build log should show `All migrations have been successfully applied` and `Seed complete`.

## Step 6: Check it works

1. Open `https://<your-project>.vercel.app/api/health`. You should see `{"ok":true,"database":"up"}`.
2. Open `https://<your-project>.vercel.app` and choose **Sign in**. Enter `you@gmail.com` and open the email (check Spam the first time). You land on Ana Reyes's coach dashboard. You're also the admin: open the account menu (person icon) and choose **Admin**.
3. In a private/incognito tab, sign in as `you+client@gmail.com`. You're client Bea Lim, training with Ana.
4. Follow `docs/demo/phase-1.md` for the full walkthrough. Replace `localhost:3000` with your Vercel address.

---

## Security notes

- **Supabase Data API.** Supabase normally lets anyone holding the project's public "anon" key read tables through its Data API. CoachBook doesn't use that API, so the migration `*_lock_down_data_api` blocks those roles and turns on row-level security for every table. For extra safety you can also switch the API off: Supabase dashboard → **Project Settings → Data API** → turn off.
- **Database TLS.** Connections to Supabase are encrypted. To also verify the certificate, download the CA from Supabase (**Database settings → SSL Configuration**) and paste its contents into a `DATABASE_CA_CERT` environment variable.
- **Secrets** (`AUTH_SECRET`, `SMTP_PASSWORD`, the database URLs) live only in Vercel's environment variables, never in the repo.

## Day-to-day

- **New code goes live automatically.** Every push to the `claude/coachbook-platform-38lzqr` branch (the repo's default branch) deploys to production, and migrations run during the build.
- **Demo data is seeded only once.** With `SEED_ON_DEPLOY=true`, the seed runs only while the database is empty, so your real data is never overwritten. You can leave it on.
- **Restarting from scratch:** in Supabase, open **SQL Editor** and run `DROP SCHEMA public CASCADE; CREATE SCHEMA public;`, then redeploy. ⚠️ This permanently deletes all data.

## Later: switching to Resend (needs your own domain)

1. Add and verify your domain in Resend, then create an API key.
2. In Vercel, set `SMTP_HOST=smtp.resend.com`, `SMTP_PORT=465`, `SMTP_USER=resend`, `SMTP_PASSWORD=<api key>` and `EMAIL_FROM=CoachBook <no-reply@yourdomain.com>`.
3. Redeploy.

## Optional: Google sign-in

Create an OAuth client in Google Cloud Console. Set the authorized redirect URI to `https://<your-project>.vercel.app/api/auth/callback/google`. Then add `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` in Vercel and redeploy. The **Continue with Google** button appears automatically.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Build fails with `DATABASE_URL`/`Can't reach database` | Step 4 isn't done, or the deploy ran before Supabase was connected. Redeploy. |
| `/api/health` shows `"database":"down"` | The Supabase project may be paused (free tier). Resume it in Supabase. |
| No sign-in email | Check Spam. Check that the app password has no spaces and `SMTP_PORT` is `465`. Vercel → Logs shows the error. |
| "This account can't sign in" | That account was suspended by an admin. |
| Invite links point to `localhost` | Set `APP_URL` to your Vercel address. Normally it's detected automatically. |
