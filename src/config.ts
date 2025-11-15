import dotenv from 'dotenv';
import { dirname,resolve} from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename__ = fileURLToPath(import.meta.url);
const directory = dirname(__filename__);
const projectRoot = resolve(directory,'..');

// Resolve all paths relative to project root (no ENV needed for paths)
const clipsPath = resolve(projectRoot, 'clips');
const downloadsPath = resolve(projectRoot, 'downloads');
const outputsPath = resolve(projectRoot, 'outputs');
const queuePath = resolve(projectRoot, 'clip-queue.json');

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
    maxClips: 50, // Maximum number of clips to keep
  },
  paths: {
    downloads: downloadsPath,
    clips: clipsPath,
    outputs: outputsPath,
    queue: queuePath,
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

