# Raha Convention Centre — Deployment Guide

## Overview

This app is a **Next.js 16** application deployed on **Cloudflare Pages** with:
- **Google Sheets** as the database (via service account)
- **Resend** for confirmation emails
- **In-app calendar** for availability (no Google Calendar dependency)

---

## Step 1: Create a Google Service Account

A service account lets the app access Google Sheets without your personal login.

1. Go to **https://console.cloud.google.com**
2. Select your Google account (or create one — use `n4k2009@gmail.com`)
3. Click the **hamburger menu (☰)** → **APIs & Services** → **Library**
4. Search for **"Google Sheets API"** → click it → click **"Enable"**
5. Go back to **APIs & Services** → **Credentials**
6. Click **"+ Create Credentials"** → **Service Account**
7. Fill in:
   - Name: `raha-booking`
   - Description: `Accesses booking spreadsheet`
   - Click **"Create and Continue"**
   - Role: **Editor** (or skip this step)
   - Click **"Done"**
8. Click on the service account you just created
9. Go to the **"Keys"** tab → **"Add Key"** → **"Create new key"** → **JSON** → **Create**
10. A JSON file will download. **Save it somewhere safe** — you'll need values from it.

### From the JSON file, note down:
- `client_email` → this is `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `private_key` → this is `GOOGLE_PRIVATE_KEY`

---

## Step 2: Create and Share the Google Spreadsheet

1. Go to **https://sheets.google.com**
2. Click **"+ Blank"** to create a new spreadsheet
3. Name it: **`Raha Convention Centre Bookings`**
4. In the spreadsheet URL, copy the long ID between `/d/` and `/edit`:
   - Example: `https://docs.google.com/spreadsheets/d/ABC123xyz.../edit`
   - The `ABC123xyz...` part is your `GOOGLE_SPREADSHEET_ID`
5. **Share the spreadsheet** with your service account:
   - Click **"Share"** (top right)
   - Paste the `client_email` from the JSON file
   - Set permission to **"Editor"**
   - Click **"Send"**

**Do NOT create any sheets manually** — the app creates the "Bookings" sheet with all headers automatically on first run.

---

## Step 3: Set Up Resend for Emails (Optional)

1. Go to **https://resend.com** → sign up (free tier: 100 emails/day)
2. On the dashboard, click **"API Keys"** → **"Create API Key"**
3. Name it `raha-booking` → copy the key (starts with `re_`)
4. This is your `RESEND_API_KEY`

If you skip this, bookings still save to Sheets — just no email confirmations.

---

## Step 4: Push Code to GitHub

```bash
cd raha-booking-next
git init
git add -A
git commit -m "Initial commit — Raha Convention Centre booking system"
```

Then create a new repo on GitHub:
1. Go to **https://github.com/new**
2. Name: `raha-booking-next`
3. **Do NOT** initialize with README (we already have one)
4. Click **"Create repository"**
5. Follow the "push an existing repository" instructions:
```bash
git remote add origin https://github.com/YOUR_USERNAME/raha-booking-next.git
git branch -M main
git push -u origin main
```

---

## Step 5: Deploy to Cloudflare Pages

1. Go to **https://dash.cloudflare.com**
2. Click **"Workers & Pages"** → **"Create"** → **"Pages"** → **"Connect to Git"**
3. Authorize GitHub if prompted
4. Select your `raha-booking-next` repository
5. Configure:
   - **Production branch:** `main`
   - **Build command:** `npm run build`
   - **Build output directory:** `.next`
   - **Framework preset:** Next.js
6. Click **"Save and Deploy"**

### Add Environment Variables

After deployment starts:
1. Go to your Pages project → **"Settings"** → **"Environment variables"**
2. Add these variables (click "Add" for each):

| Variable | Value |
|----------|-------|
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | `client_email` from the JSON file |
| `GOOGLE_PRIVATE_KEY` | The full `private_key` from the JSON (including `-----BEGIN...` and `-----END...`) |
| `GOOGLE_SPREADSHEET_ID` | The ID from the spreadsheet URL |
| `RESEND_API_KEY` | `re_...` from Resend (optional, for emails) |
| `BUFFER_MINUTES` | `120` (2-hour cleaning buffer) |

3. Click **"Retry deployment"** to redeploy with the new env vars

---

## Step 6: Verify Everything Works

1. Open your Cloudflare Pages URL (something like `https://raha-booking-next.pages.dev`)
2. Click **"Calendar"** tab → select today → should show "08:00 AM → AVAILABLE"
3. Click **"New Booking"** tab → fill in a test booking → submit
4. Check:
   - ✅ Booking shows in Google Sheets
   - ✅ Calendar tab now shows the booking
   - ✅ Dashboard stats updated
   - ✅ Confirmation email received (if Resend is configured)

---

## How the Owner in UAE Accesses Data

The owner can access everything from any device, anywhere:

1. **Google Sheets** — open https://sheets.google.com → open "Raha Convention Centre Bookings"
   - Real-time view of all bookings
   - Can export to Excel/PDF anytime

2. **The Web App** — just open the Cloudflare Pages URL in any browser
   - Dashboard with live stats
   - Calendar view of all bookings
   - No dependency on receptionist's computer

---

## Updating the App

After making code changes:

```bash
git add -A
git commit -m "Description of changes"
git push
```

Cloudflare Pages **auto-deploys** on every push to `main`. Takes about 60 seconds.

---

## Troubleshooting

### "Google Sheets credentials not configured"
→ Environment variables not set in Cloudflare Pages. Go to Settings → Environment variables.

### Calendar shows "Select a date" with no data
→ Normal when Sheets isn't connected. Once env vars are set, the calendar populates.

### Emails not arriving
→ Check Resend dashboard for delivery status. Verify `RESEND_API_KEY` is set.

### Build fails on Cloudflare
→ Check build logs in Cloudflare Pages dashboard. Usually it's a missing dependency.

### Overlap/rejection not working
→ The `BUFFER_MINUTES` env var defaults to 120 (2 hours). You can change it in Cloudflare env vars.
