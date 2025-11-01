# Mux Streaming Integration - Complete Step-by-Step Guide

This guide walks you through setting up Mux streaming from start to finish.

## Prerequisites

- Mux account (free tier available at https://www.mux.com)
- A video file (MP4, MOV, etc.) to test with
- Server and mobile app set up as per project README

## Step 1: Create Mux Account & Get Credentials

1. **Sign up**: Go to https://www.mux.com and create an account
2. **Navigate to Access Tokens**:
   - Go to Settings → Access Tokens
   - Click "Generate new token"
3. **Configure token**:
   - Environment: Development (or Production for live)
   - Permissions: Full Access for Mux Video
   - Click "Generate Token"
4. **Copy credentials**:
   - **Token ID**: Copy this value
   - **Token Secret**: Copy this value (you'll only see it once!)

## Step 2: Configure Server Environment

1. Open `server/.env` (create if it doesn't exist)
2. Add your Mux credentials:
   ```env
   MUX_TOKEN_ID=your_token_id_here
   MUX_TOKEN_SECRET=your_token_secret_here
   ```
3. Save the file

**Note**: The server validates these on startup. If they're missing, the server won't start.

## Step 3: Upload a Test Video to Mux

### Option A: Using Mux Dashboard (Easiest)

1. Log in to https://dashboard.mux.com
2. Click **Assets** in the sidebar
3. Click **Upload** button
4. Select your video file
5. Wait for upload and processing (usually 1-5 minutes)
6. Once status shows "Ready", click on the asset
7. **Copy the Playback ID** (looks like `abc123xyz...`)

### Option B: Using cURL (For API-Based Upload)

If your video is hosted somewhere (S3, Cloudflare, etc.):

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

The response will look like:
```json
{
  "data": {
    "id": "asset-id-here",
    "playback_ids": [
      {
        "id": "playback-id-here",
        "policy": "public"
      }
    ],
    "status": "preparing"
  }
}
```

**Copy the `playback_ids[0].id`** - this is your Playback ID.

**Note**: For local files, you can:
- Upload to a temporary service (e.g., file.io, wetransfer)
- Use ngrok to expose a local HTTP server
- Use AWS S3, Cloudflare R2, or similar

## Step 4: Test Your Mux Playback ID

Before adding to the database, verify the playback ID works:

1. Construct the HLS URL:
   ```
   https://stream.mux.com/YOUR_PLAYBACK_ID.m3u8
   ```

2. Test in a browser:
   - Open VLC Media Player → Open Network Stream
   - Paste the URL
   - Or open in Safari (supports HLS natively)

3. If video plays, you're ready to proceed!

## Step 5: Add Playback ID to Database

### Method 1: Direct SQL Update (Quick Test)

1. Start your database connection (psql, pgAdmin, etc.)
2. Find a show ID:
   ```sql
   SELECT id, title FROM shows LIMIT 1;
   ```
3. Find an episode to update:
   ```sql
   SELECT id, "order", title, mux_playback_id 
   FROM episodes 
   WHERE show_id = 'your-show-id-here' 
   ORDER BY "order" 
   LIMIT 1;
   ```
4. Update with your real playback ID:
   ```sql
   UPDATE episodes 
   SET mux_playback_id = 'YOUR_PLAYBACK_ID_HERE',
       thumbnail_url = 'https://image.mux.com/YOUR_PLAYBACK_ID_HERE/thumbnail.jpg'
   WHERE id = 'episode-id-here';
   ```

### Method 2: Use the Helper Script (Recommended)

1. Get a show ID from your database:
   ```bash
   # In psql or your DB client
   SELECT id FROM shows LIMIT 1;
   ```

2. Run the update script:
   ```bash
   cd server
   npx ts-node scripts/update-mux-playback-ids.ts \
     "your-show-uuid-here" \
     "your-playback-id-here"
   ```

3. For multiple episodes, provide multiple playback IDs:
   ```bash
   npx ts-node scripts/update-mux-playback-ids.ts \
     "show-uuid" \
     "playback-id-1" \
     "playback-id-2" \
     "playback-id-3"
   ```

The script will update episodes in order (starting from order 1).

## Step 6: Start the Server

1. Navigate to server directory:
   ```bash
   cd server
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Verify it's running:
   ```bash
   curl http://localhost:4000/api/v1/health
   ```
   Should return: `{"status":"ok"}`

## Step 7: Start the Mobile App

1. Navigate to mobile directory:
   ```bash
   cd mobile
   ```

2. Start Expo:
   ```bash
   npm start
   ```

3. Open on your device/emulator:
   - Scan QR code with Expo Go app (iOS/Android)
   - Or press `a` for Android emulator, `i` for iOS simulator

## Step 8: Test Video Streaming

1. **Navigate to Shows**:
   - Open the app
   - Find the show you updated

2. **Open Episode**:
   - Tap on the episode you updated with the real playback ID

3. **Verify Playback**:
   - Video should load and play automatically
   - Should stream from `https://stream.mux.com/YOUR_PLAYBACK_ID.m3u8`
   - Test swipe gestures (swipe up for next, down for previous)

4. **Check Logs** (if issues):
   - Mobile app: Check Expo/Metro bundler logs
   - Server: Check server console for API requests

## Troubleshooting

### Video Not Playing

**Check 1**: Verify playback ID is correct
```bash
# In browser or VLC, test the URL directly
https://stream.mux.com/YOUR_PLAYBACK_ID.m3u8
```

**Check 2**: Verify Mux asset is "ready"
- Go to Mux Dashboard → Assets
- Find your asset
- Status should be "ready" (not "preparing" or "errored")

**Check 3**: Check network connectivity
- Ensure device/emulator can reach `stream.mux.com`
- Check firewall/proxy settings

**Check 4**: Verify database has correct playback ID
```sql
SELECT mux_playback_id FROM episodes WHERE id = 'your-episode-id';
```

### Server Won't Start

**Error**: "Invalid environment variables: MUX_TOKEN_ID"

- Check `.env` file exists in `server/` directory
- Verify `MUX_TOKEN_ID` and `MUX_TOKEN_SECRET` are set
- No quotes needed around values in `.env`
- Restart server after changing `.env`

### Video Takes Long to Load

- Normal for first load (buffering)
- Mux provides adaptive bitrate streaming
- Check internet connection speed
- Larger videos take longer to buffer

## Next Steps

1. **Upload More Videos**: Add more episodes with real Mux playback IDs
2. **Add Thumbnails**: Mux auto-generates thumbnails - use the format in the update script
3. **Monitor Usage**: Check Mux dashboard for streaming analytics
4. **Production**: Move to Production environment tokens when ready

## Quick Reference

- **Mux Dashboard**: https://dashboard.mux.com
- **Mux API Docs**: https://docs.mux.com
- **HLS URL Format**: `https://stream.mux.com/{PLAYBACK_ID}.m3u8`
- **Thumbnail URL**: `https://image.mux.com/{PLAYBACK_ID}/thumbnail.jpg`
- **Server Port**: `http://localhost:4000`
- **API Health**: `http://localhost:4000/api/v1/health`

## Example Complete Flow

```bash
# 1. Upload video via Mux Dashboard → Get playback ID: "abc123xyz"

# 2. Update database
cd server
npx ts-node scripts/update-mux-playback-ids.ts \
  "show-uuid-from-db" \
  "abc123xyz"

# 3. Start server
npm run dev

# 4. In another terminal, start mobile app
cd ../mobile
npm start

# 5. Test in app - video should stream!
```

---

**You're all set!** Your app can now stream videos from Mux. 🎉

