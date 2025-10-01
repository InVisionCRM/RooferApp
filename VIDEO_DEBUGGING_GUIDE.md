# Video Playback Debugging Guide

## Current Implementation

Videos are recorded using the MediaRecorder API in WebM format and uploaded to Vercel Blob storage.

## Debugging Steps

### 1. Check Browser Console Logs

When you record and save a video, check the console for these logs:

**During Recording:**
- "Using video format: [format]" - Shows which codec is being used

**When Stopping Recording:**
- "Recorded video MIME type: [type]" - Shows actual recorded format

**When Saving:**
- "Saving video with MIME type: [type] Size: [bytes]" - Shows what's being uploaded
- "Uploading video: [filename] Type: [type] Size: [bytes]" - Server-side upload info
- "Video saved to DB: {...}" - Shows what was saved to database

**When Playing Back:**
- "Video loaded successfully: [url] [mimeType]" - Video loaded OK
- "Video playback error: [url] [mimeType]" - Video failed to load

### 2. Check Video Properties

Open the browser DevTools Network tab and:
1. Filter by "video" or "blob"
2. Look for the video file request
3. Check the Response Headers:
   - `Content-Type` should be `video/webm` or similar
   - `Content-Length` should match file size
   - `Accept-Ranges: bytes` should be present (needed for video seeking)

### 3. Test Video URL Directly

1. Record a video
2. Copy the video URL from the photo grid
3. Open it directly in a new browser tab
4. If it downloads instead of playing, there's a content-type issue

### 4. Common Issues & Solutions

#### Issue: Video shows loading spinner but never plays
**Possible Causes:**
- CORS headers missing
- Wrong Content-Type header
- Range request support missing

**Solution:** Check Network tab for 206 Partial Content responses

#### Issue: Video plays in preview but not after saving
**Possible Causes:**
- MIME type mismatch in database
- Vercel Blob not serving correct headers

**Solution:** Check console logs for MIME type consistency

#### Issue: Black screen or error icon
**Possible Causes:**
- Corrupt video file
- Unsupported codec
- File upload incomplete

**Solution:** Try recording a short 2-3 second test video

### 5. Browser Compatibility

**Chrome/Edge:** Support VP8, VP9, H.264 (via WebM)
**Firefox:** Support VP8, VP9
**Safari:** Support H.264 (via WebM), but WebM support is limited

If on Safari/iOS, the browser might not support WebM at all!

### 6. Vercel Blob Configuration

Vercel Blob should automatically:
- Serve correct Content-Type headers
- Support range requests
- Enable CORS

If videos still don't play, it might be a Vercel Blob service issue.

## Quick Test

1. Record a 5-second video
2. Open browser console (F12)
3. Save the video
4. Look for the logs mentioned above
5. Share the console output to diagnose the issue

## Alternative: Convert to MP4 on Server

If WebM continues to have issues, we can:
1. Install `ffmpeg` 
2. Convert WebM to MP4 on the server after upload
3. This requires a more complex setup but ensures universal compatibility

Let me know what you see in the console and I can help diagnose further!

