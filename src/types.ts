export interface VideoClip {
  id: string;
  originalVideoUrl: string;
  originalVideoTitle: string;
  clipPath: string;
  startTime: number; // in seconds
  endTime: number; // in seconds
  duration: number; // in seconds
  title: string;
  description?: string;
  thumbnail?: string;
  createdAt: Date;
}

export interface YouTubeVideo {
  id: string;
  title: string;
  url: string;
  duration: number;
  uploadDate: string;
  description?: string;
  thumbnail?: string;
}

export interface ClipTimestamp {
  start: number; // in seconds
  end: number; // in seconds
  title?: string; // optional title suggestion
}

export interface UploadResult {
  success: boolean;
  platform: 'instagram' | 'tiktok' | 'both';
  urls?: string[];
  error?: string;
}

