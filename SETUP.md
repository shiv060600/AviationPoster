# Setup Guide

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Install System Dependencies** ⚠️ **REQUIRED**
   
   These must be installed **on the computer** that will run the application:
   
   **macOS:**
   ```bash
   brew install yt-dlp ffmpeg
   ```
   
   **Linux (Ubuntu/Debian):**
   ```bash
   sudo apt update
   sudo apt install yt-dlp ffmpeg
   ```
   
   **Windows:**
   ```powershell
   # Install yt-dlp
   pip install yt-dlp
   # OR download from: https://github.com/yt-dlp/yt-dlp/releases
   
   # Install ffmpeg
   # Download from: https://ffmpeg.org/download.html
   # Extract and add to PATH (add the 'bin' folder to your system PATH)
   ```
   
   **Verify installation:**
   ```bash
   yt-dlp --version   # Should show version number
   ffmpeg -version    # Should show version info
   ```
   
   If these commands don't work, the tools aren't in your PATH and need to be added.

3. **Create `.env` File**
   
   Create a `.env` file in the root directory with the following content:
   ```env
   # Required: OpenAI API Key for video naming
   OPENAI_API_KEY=your_openai_api_key_here
   
   # YouTube Channel URL (already set to HDMelbourneAviation)
   YOUTUBE_CHANNEL_URL=https://www.youtube.com/@HDMelbourneAviation
   
   # Optional: Instagram Credentials (if using official API or automation)
   INSTAGRAM_USERNAME=your_instagram_username
   INSTAGRAM_PASSWORD=your_instagram_password
   
   # Optional: TikTok Credentials (if using API)
   TIKTOK_ACCESS_TOKEN=your_tiktok_access_token
   
   # Video Processing Settings (optional)
   MAX_CLIP_DURATION=60
   MIN_CLIP_DURATION=15
   CLIP_FORMAT=mp4
   VIDEO_QUALITY=720p
   
   # Scheduling (optional)
   SCHEDULE_TIME=09:00
   TIMEZONE=Australia/Melbourne
   
   # Paths (optional)
   DOWNLOAD_PATH=./downloads
   CLIPS_PATH=./clips
   OUTPUT_PATH=./outputs
   ```

4. **Build the Project**
   ```bash
   npm run build
   ```

5. **Test Run**
   ```bash
   npm start
   ```

## Getting API Keys

### OpenAI API Key
1. Go to https://platform.openai.com/
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key to your `.env` file

### Instagram API (Optional)
Instagram automation is complex. Options:
- **Instagram Graph API**: Requires Meta Business account
- **Manual Upload**: Use pre-formatted content and upload manually
- **Third-party Tools**: Use services like Buffer, Hootsuite, etc.

### TikTok API (Optional)
1. Go to https://developers.tiktok.com/
2. Create a developer account
3. Create an app
4. Request Content Publishing API access
5. Generate access token

## Verify Installation

Test that all dependencies are installed:

```bash
# Check yt-dlp
yt-dlp --version

# Check ffmpeg
ffmpeg -version

# Check Node.js
node --version  # Should be 18+

# Check npm packages
npm list
```

## Troubleshooting

### yt-dlp not found
- Make sure yt-dlp is in your PATH
- Try reinstalling: `pip install --upgrade yt-dlp`

### ffmpeg not found
- Verify installation: `which ffmpeg` (Linux/Mac) or `where ffmpeg` (Windows)
- Add ffmpeg to your system PATH

### Module not found errors
- Run `npm install` again
- Delete `node_modules` and `package-lock.json`, then run `npm install`

### OpenAI API errors
- Verify API key is correct
- Check API key has sufficient credits
- Review OpenAI API documentation for rate limits

## Next Steps

1. **Test with a single video**: Run `npm start` to test the workflow
2. **Review generated clips**: Check the `./clips` directory
3. **Set up scheduling**: Use `npm run schedule` for daily automation
4. **Customize timestamps**: Edit `TimestampExtractor` to detect specific moments

## Legal Reminders

⚠️ **Important**: 
- Contact the YouTube channel owner before using their content
- Get written permission
- Discuss revenue sharing if monetizing
- Always give proper attribution
- Respect copyright laws

