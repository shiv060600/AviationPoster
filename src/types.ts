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
export interface ClipTimestamp {
  start: number; // in seconds
  end: number; // in seconds
}

export interface YouTubeVideo {
  id: string;
  title: string;
  url: string;
  duration: number;
  uploadDate: string;
  timestamps?: Array<ClipTimestamp>;
  thumbnail?: string;
}



export interface UploadResult {
  success: boolean;
  platform: 'instagram' | 'tiktok' | 'both';
  urls?: string[];
  error?: string;
}

export interface QueuedClip {
  videoId: string;
  videoUrl: string;
  videoTitle: string;
  timestamp: ClipTimestamp;
  addedAt: string; // ISO date string
}

export interface ClipQueue {
  clips: QueuedClip[];
  lastUpdated: string; // ISO date string
}

export interface DirectoryItem {
  name: string;
  path: string;
  size: number;
  createdAt: Date;
  modifiedAt: Date;
}

