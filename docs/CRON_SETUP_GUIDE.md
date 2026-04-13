# Cron Job Setup Guide (cron-job.org)

Use cron-job.org to publish scheduled posts every few minutes—**free**, no Vercel Pro needed.

> **Note:** Vercel cron is disabled in this project (free tier only allows daily). We use cron-job.org instead.

---

## Step 1: Create Account

1. Go to **https://cron-job.org**
2. Click **Sign up** (top right)
3. Register with email or Google

---

## Step 2: Create a New Cron Job

1. After login, click **Create cronjob** (or **Cronjobs** → **Create cronjob**)
2. Fill in:

| Field | Value |
|-------|--------|
| **Title** | `ZeeBuddy Publish Scheduled Posts` |
| **URL** | `https://YOUR-APP.vercel.app/api/v1/cron/publish-scheduled` |
| **Schedule** | Every 5 minutes (or 1 minute) |

---

## Step 3: Set the URL

Replace `YOUR-APP` with your actual Vercel app URL, e.g.:

- `https://zee-admin.vercel.app/api/v1/cron/publish-scheduled`
- `https://zeebuddy-admin.vercel.app/api/v1/cron/publish-scheduled`

Use the exact URL from your Vercel deployment.

---

## Step 4: Set Schedule (Every 5 Minutes)

1. Under **Schedule**, choose **Interval**
2. Set **Every** → `5` **minutes**

Or for every 1 minute:

- Set **Every** → `1` **minutes**

---

## Step 5: Add Authorization Header (Important)

Your API checks this header to allow only trusted requests. Without it, you may get **401 Unauthorized**.

### Where to add it on cron-job.org

1. On the cron job create/edit page, scroll down
2. Find **Advanced** or **Request options** and expand it
3. Look for **Request headers** or **Headers** section
4. Click **Add header** or **+**

### What to enter (with your secret: `abfdulaah2310ishaq`)

| Field | Enter exactly this |
|-------|--------------------|
| **Header name** | `Authorization` |
| **Header value** | `Bearer abfdulaah2310ishaq` |

**Important:** 
- Header name = `Authorization` (capital A, rest lowercase)
- Header value = `Bearer ` + your secret (space after Bearer, no extra spaces)
- Do **not** put quotes around the value

### Visual example

```
┌─────────────────────────────────────────────────────────────┐
│  Request headers                                             │
├─────────────────┬───────────────────────────────────────────┤
│  Header name    │  Authorization                             │
├─────────────────┼───────────────────────────────────────────┤
│  Header value   │  Bearer abfdulaah2310ishaq                 │
└─────────────────┴───────────────────────────────────────────┘
```

### If you use a different secret

Replace `abfdulaah2310ishaq` with your secret. The value must always be: `Bearer ` + your secret.

---

## Step 6: Set CRON_SECRET in Vercel

1. Go to **Vercel Dashboard** → your project → **Settings** → **Environment Variables**
2. Add:
   - **Name:** `CRON_SECRET`
   - **Value:** `abfdulaah2310ishaq` (same as Step 5—no "Bearer ", just the secret)
   - **Environment:** Production (and Preview if needed)
3. **Save** and **Redeploy** the app

> **Note:** In Vercel you only put the secret (`abfdulaah2310ishaq`). In cron-job.org header you put `Bearer abfdulaah2310ishaq`.

---

## Step 7: Save and Enable

1. Click **Create** or **Save** on cron-job.org
2. Ensure the job is **Enabled** (toggle on)
3. The job will start running on the next interval

---

## Verify It Works

### Option A: Check cron-job.org Logs

1. Go to **Cronjobs** → your job → **Execution history**
2. You should see successful runs (HTTP 200)

### Option B: Test Manually

1. Create a scheduled post in admin with `scheduledAt` = 1 minute from now
2. Wait 5–6 minutes (for cron to run)
3. Check news feed—post should appear as published

### Option C: Call API Directly

```bash
curl -H "Authorization: Bearer abfdulaah2310ishaq" https://YOUR-APP.vercel.app/api/v1/cron/publish-scheduled
```

Expected response:
```json
{"success":true,"published":0,"message":"No posts due"}
```
or
```json
{"success":true,"published":1,"message":"Published 1 post(s)"}
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| **401 Unauthorized** | Header value must be `Bearer abfdulaah2310ishaq`; Vercel `CRON_SECRET` must be `abfdulaah2310ishaq` (no Bearer) |
| **404 Not Found** | Verify URL; ensure route is `/api/v1/cron/publish-scheduled` |
| **500 Error** | Check Vercel logs; MongoDB connection and env vars |
| **Posts not publishing** | Confirm `scheduledAt` is in the past; cron runs every 5 min |

---

## Summary Checklist

- [ ] cron-job.org account created
- [ ] Cron job created with correct URL
- [ ] Schedule set to every 5 (or 1) minutes
- [ ] `Authorization: Bearer CRON_SECRET` header added
- [ ] `CRON_SECRET` set in Vercel env vars
- [ ] App redeployed after adding env var
- [ ] Job enabled and running
