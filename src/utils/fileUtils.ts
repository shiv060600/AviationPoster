import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

export function ensureDirectoryExists(dirPath: string): void {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
}

export function getVideoFilename(videoId: string, extension: string = 'mp4'): string {
  return `${videoId}.${extension}`;
}

export function getClipFilename(clipId: string, extension: string = 'mp4'): string {
  return `clip_${clipId}.${extension}`;
}

export function sanitizeFilename(filename: string): string {
  // Remove or replace invalid filename characters
  return filename
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .substring(0, 200); // Limit length
}

