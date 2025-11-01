# Mux Streaming - Quick Start

**TL;DR**: Upload video to Mux → Get playback ID → Update database → Stream!

## 3-Minute Setup

1. **Get Mux credentials**:
   - Sign up: https://www.mux.com
   - Settings → Access Tokens → Generate new token
   - Copy Token ID and Token Secret

2. **Add to `.env`**:
   ```env
   MUX_TOKEN_ID=your_token_id
   MUX_TOKEN_SECRET=your_token_secret
   ```

3. **Upload video**:
   - Mux Dashboard → Assets → Upload
   - Wait for "Ready" status
   - Copy Playback ID

4. **Update database**:
   ```bash
   # Using helper script (recommended)
   npx ts-node scripts/update-mux-playback-ids.ts \
     "show-uuid" \
     "playback-id"
   
   # Or direct SQL
   UPDATE episodes 
   SET mux_playback_id = 'your-playback-id'
   WHERE id = 'episode-id';
   ```

5. **Test in app**:
   - Start server: `npm run dev`
   - Start mobile: `cd ../mobile && npm start`
   - Open episode → Video streams from Mux!

## Key URLs

- **Stream URL**: `https://stream.mux.com/{PLAYBACK_ID}.m3u8`
- **Thumbnail URL**: `https://image.mux.com/{PLAYBACK_ID}/thumbnail.jpg`
- **Mux Dashboard**: https://dashboard.mux.com

## Full Guides

- **Step-by-step**: [MUX_SETUP_STEP_BY_STEP.md](./MUX_SETUP_STEP_BY_STEP.md)
- **Detailed reference**: [MUX_STREAMING_SETUP.md](./MUX_STREAMING_SETUP.md)

