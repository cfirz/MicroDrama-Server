# Mux Streaming Setup Guide

This guide explains how to set up Mux streaming for your micro-drama app. The app uses Mux to host and stream video content via HLS (HTTP Live Streaming).

## Overview

The mobile app streams videos using Mux playback URLs in the format:
```
https://stream.mux.com/{PLAYBACK_ID}.m3u8
```

Each episode in the database needs a `mux_playback_id` that corresponds to a Mux asset.

## Step 1: Set Up Mux Account

1. **Sign up for Mux**: Visit [https://www.mux.com](https://www.mux.com) and create an account
2. **Get API Credentials**:
   - Go to **Settings** → **Access Tokens**
   - Click **Generate new token**
   - Choose environment (Development or Production)
   - Set permissions (Full Access for Mux Video)
   - Copy the **Token ID** and **Token Secret**

3. **Set Environment Variables**:
   Update your `server/.env` file:
   ```env
   MUX_TOKEN_ID=your_token_id_here
   MUX_TOKEN_SECRET=your_token_secret_here
   ```

## Step 2: Upload Videos to Mux

You have several options to upload videos to Mux:

### Option A: Mux Dashboard (Easiest for Testing)

1. Log in to [Mux Dashboard](https://dashboard.mux.com)
2. Go to **Assets** → **Upload**
3. Upload your video file (MP4, MOV, etc.)
4. Wait for processing (status will show "ready")
5. Once ready, copy the **Playback ID** from the asset details

### Option B: Mux API (Recommended for Production)

Use the Mux API to upload videos programmatically:

```bash
curl https://api.mux.com/video/v1/assets \
  -H "Content-Type: application/json" \
  -X POST \
  -d '{
    "input": "https://your-storage-url.com/your-video.mp4",
    "playback_policy": ["public"]
  }' \
  -u YOUR_TOKEN_ID:YOUR_TOKEN_SECRET
```

The response will include:
- `id`: Asset ID (for management)
- `playback_ids[0].id`: **Playback ID** (use this in database)

**Note**: Mux requires videos to be accessible via URL. If you have local files, you can:
- Use a temporary hosting service
- Host on AWS S3, Cloudflare R2, or similar
- Use ngrok to expose a local file server temporarily

### Option C: Direct Upload (For Large Files)

For large files, use Mux's direct upload feature:

1. Create an upload URL via API
2. Upload file directly to Mux storage
3. Mux will process and return a playback ID

## Step 3: Add Playback IDs to Database

Once you have Mux playback IDs, you need to add them to your database.

### Method 1: Update Existing Episodes

Update episodes in the database with real Mux playback IDs:

```sql
-- Update a specific episode
UPDATE episodes 
SET mux_playback_id = 'YOUR_MUX_PLAYBACK_ID_HERE'
WHERE id = 'episode-uuid-here';
```

### Method 2: Insert New Episodes with Real IDs

```sql
INSERT INTO episodes (show_id, title, "order", mux_playback_id, duration_sec, thumbnail_url)
VALUES (
  'show-uuid-here',
  'Episode Title',
  1,
  'YOUR_MUX_PLAYBACK_ID_HERE',
  120,  -- duration in seconds
  'https://image.mux.com/YOUR_MUX_PLAYBACK_ID_HERE/thumbnail.jpg'  -- Mux auto-generates thumbnails
);
```

### Method 3: Use a Seed Script (Recommended)

Create a custom seed script that uses real Mux playback IDs. Example:

```typescript
// server/scripts/seed-with-real-mux.ts
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

async function seedWithRealMux() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  // Your Mux playback IDs (get these from Mux dashboard or API)
  const muxPlaybackIds = [
    'playback-id-1',
    'playback-id-2',
    'playback-id-3',
    // ... more IDs
  ];

  // Insert or update episodes with real playback IDs
  for (let i = 0; i < muxPlaybackIds.length; i++) {
    await pool.query(
      `UPDATE episodes 
       SET mux_playback_id = $1 
       WHERE "order" = $2 AND show_id = $3`,
      [muxPlaybackIds[i], i + 1, 'your-show-id']
    );
  }

  await pool.end();
}
```

## Step 4: Get Mux Thumbnails (Optional)

Mux automatically generates thumbnails for your videos. Use this format:

```
https://image.mux.com/{PLAYBACK_ID}/thumbnail.jpg
```

Update the `thumbnail_url` column in your episodes table:

```sql
UPDATE episodes 
SET thumbnail_url = 'https://image.mux.com/' || mux_playback_id || '/thumbnail.jpg'
WHERE thumbnail_url IS NULL;
```

## Step 5: Test Streaming

1. **Start the server**:
   ```bash
   cd server
   npm run dev
   ```

2. **Start the mobile app**:
   ```bash
   cd mobile
   npm start
   ```

3. **Test playback**:
   - Navigate to a show in the app
   - Tap an episode
   - The video should load and play from Mux
   - URL format: `https://stream.mux.com/{PLAYBACK_ID}.m3u8`

## Troubleshooting

### Video Not Playing

1. **Check Playback ID**: Ensure the playback ID exists in Mux and the asset is in "ready" state
2. **Check CORS**: Mux handles CORS automatically for public playback policies
3. **Check Network**: Ensure device/emulator can reach `stream.mux.com`
4. **Check Logs**: Look for errors in mobile app console

### Asset Not Ready

- Mux takes time to process videos (usually a few minutes)
- Check asset status in Mux dashboard
- Status should be "ready" before playback works

### Authentication Errors

- Verify `MUX_TOKEN_ID` and `MUX_TOKEN_SECRET` in `.env`
- Ensure tokens have correct permissions
- Tokens are only needed for API uploads, not for playback

## Quick Reference

- **Mux Dashboard**: https://dashboard.mux.com
- **Mux API Docs**: https://docs.mux.com
- **HLS URL Format**: `https://stream.mux.com/{PLAYBACK_ID}.m3u8`
- **Thumbnail URL Format**: `https://image.mux.com/{PLAYBACK_ID}/thumbnail.jpg`
- **Test HLS URL**: Open in VLC or Safari to verify playback works

## Next Steps

1. Upload test videos to Mux
2. Get playback IDs
3. Update database with real playback IDs
4. Test streaming in mobile app
5. For production: Set up automated video upload pipeline

