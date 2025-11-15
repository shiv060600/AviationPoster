# Aviation Poster

Automated video clipping and posting system for aviation content from YouTube channels. This project downloads videos from a YouTube channel, extracts interesting clips based on timestamps, generates AI-powered titles and descriptions, and uploads them to Instagram Reels and TikTok.

## Features

- 🎥 **YouTube Integration**: Automatically fetch and download latest videos from a YouTube channel using yt-dlp
- ✂️ **Video Clipping**: Extract clips from videos based on timestamps or automatic detection
- 🤖 **AI Naming**: Generate engaging titles and descriptions using OpenAI GPT-4
- 📱 **Social Media Upload**: Post clips to Instagram Reels and TikTok (requires API setup)
- ⏰ **Automated Scheduling**: Run daily tasks automatically using cron

## Prerequisites

⚠️ **System Dependencies Required** (must be installed on the computer running this app):

- **Node.js 18+ and npm**
- **yt-dlp** - Must be installed system-wide and accessible in PATH:
  - macOS: `brew install yt-dlp`
  - Linux: `sudo apt install yt-dlp` or `pip install yt-dlp`
  - Windows: `pip install yt-dlp` or download from GitHub
- **ffmpeg** - Must be installed system-wide and accessible in PATH:
  - macOS: `brew install ffmpeg`
  - Linux: `sudo apt install ffmpeg`
  - Windows: Download from https://ffmpeg.org/download.html and add to PATH

**API Keys:**
- OpenAI API key (for AI naming)
- Instagram/TikTok API credentials (for automated posting, optional)

**Note:** The app will automatically check for these dependencies on startup and show an error if they're missing.

## Installation

1. Clone the repository:
```bash
cd AviationPoster
```

2. Install dependencies:
```bash
npm install
```

3. Install yt-dlp and ffmpeg:
```bash
# macOS
brew install yt-dlp ffmpeg

# Linux (Ubuntu/Debian)
sudo apt install yt-dlp ffmpeg

# Windows
pip install yt-dlp
# Download ffmpeg from https://ffmpeg.org/download.html
```

4. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

5. Configure your `.env` file with your API keys and settings:
```env
OPENAI_API_KEY=your_openai_api_key_here
YOUTUBE_CHANNEL_URL=https://www.youtube.com/@HDMelbourneAviation
INSTAGRAM_USERNAME=your_instagram_username
INSTAGRAM_PASSWORD=your_instagram_password
TIKTOK_ACCESS_TOKEN=your_tiktok_access_token
```

6. Build the project:
```bash
npm run build
```

## Usage

### Run Once (Immediate Processing)
```bash
npm start
```

### Run as Scheduled Service
```bash
npm run schedule
```
This will start the scheduler and run the daily task at the configured time (default: 09:00 Australia/Melbourne).

## Configuration

Edit `.env` file to configure:

- **Video Settings**: Max/min clip duration, quality, format
- **Scheduling**: Time and timezone for daily runs
- **Paths**: Download, clips, and output directories
- **Social Media**: Credentials for Instagram and TikTok

## Project Structure

```
AviationPoster/
├── src/
│   ├── config.ts              # Configuration management
│   ├── types.ts               # TypeScript type definitions
│   ├── index.ts               # Main entry point
│   ├── services/
│   │   ├── youtubeDownloader.ts    # YouTube video downloader
│   │   ├── videoClipper.ts         # Video clipping with ffmpeg
│   │   ├── aiNamingAgent.ts        # AI title/description generator
│   │   ├── socialUploader.ts       # Instagram/TikTok uploader
│   │   ├── timestampExtractor.ts   # Extract timestamps from videos
│   │   └── scheduler.ts            # Daily scheduler
│   └── utils/
│       └── fileUtils.ts       # File utilities
├── package.json
├── tsconfig.json
└── README.md
```

## How It Works

1. **Fetch Videos**: Downloads latest videos from the configured YouTube channel
2. **Extract Timestamps**: Analyzes video descriptions or generates automatic timestamps
3. **Create Clips**: Uses ffmpeg to extract clips based on timestamps
4. **AI Naming**: Generates engaging titles and descriptions using OpenAI
5. **Upload**: Posts clips to Instagram Reels and TikTok

## Timestamp Detection

The system can extract timestamps in two ways:

1. **From Video Description**: Looks for patterns like `00:15`, `1:23`, `10:30-12:45` in the video description
2. **Automatic Generation**: If no timestamps found, generates clips at equal intervals throughout the video

You can extend `TimestampExtractor` to use AI for detecting interesting moments.

## Social Media Integration

### Instagram
Instagram automation requires one of:
- Instagram Graph API (requires Meta Business account)
- Puppeteer automation (may violate ToS - use at your own risk)
- Manual upload with pre-formatted content

### TikTok
TikTok automation requires:
- TikTok Developer account
- TikTok API access token
- Content Publishing API access

**Note**: Automated posting to social media may violate platform Terms of Service. Use responsibly and ensure you have permission to repost content.

## Legal & Ethical Considerations

- ✅ **Always get permission** from the original content creator before reposting their videos
- ✅ **Give proper attribution** to the original channel
- ✅ **Respect copyright** - ensure you have rights to repost content
- ✅ **Check platform ToS** - automated posting may violate Instagram/TikTok terms
- ✅ **Consider revenue sharing** - if monetizing, share revenue with original creator

## Development

```bash
# Development mode with hot reload
npm run dev

# Build TypeScript
npm run build

# Run built version
npm start
```

## Troubleshooting

### yt-dlp not found
Make sure yt-dlp is installed and in your PATH:
```bash
which yt-dlp  # Should show path to yt-dlp
```

### ffmpeg not found
Install ffmpeg and ensure it's in your PATH:
```bash
which ffmpeg  # Should show path to ffmpeg
```

### Video download fails
- Check internet connection
- Verify YouTube channel URL is correct
- Ensure yt-dlp is up to date: `pip install --upgrade yt-dlp`

### AI naming fails
- Verify OpenAI API key is set correctly
- Check API key has sufficient credits
- Review OpenAI API status


