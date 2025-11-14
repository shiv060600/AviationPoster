import dotenv from 'dotenv';

dotenv.config();

export const config = {
  youtube: {
    channelUrl: process.env.YOUTUBE_CHANNEL_URL || 'https://www.youtube.com/@HDMelbourneAviation',
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
  },
  video: {
    maxDuration: parseInt(process.env.MAX_CLIP_DURATION || '60'),
    minDuration: parseInt(process.env.MIN_CLIP_DURATION || '15'),
    format: process.env.CLIP_FORMAT || 'mp4',
    quality: process.env.VIDEO_QUALITY || '720p',
  },
  paths: {
    downloads: process.env.DOWNLOAD_PATH || './downloads',
    clips: process.env.CLIPS_PATH || './clips',
    outputs: process.env.OUTPUT_PATH || './outputs',
  },
  schedule: {
    time: process.env.SCHEDULE_TIME || '09:00',
    timezone: process.env.TIMEZONE || 'Australia/Melbourne',
  },
  social: {
    instagram: {
      username: process.env.INSTAGRAM_USERNAME || '',
      password: process.env.INSTAGRAM_PASSWORD || '',
    },
    tiktok: {
      accessToken: process.env.TIKTOK_ACCESS_TOKEN || '',
    },
  },
};

