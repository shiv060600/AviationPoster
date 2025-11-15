import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from 'fs';
import { join } from 'path';
import { DirectoryItem } from '../types';

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

/**
 * Get all items in a directory with timestamps
 */
export function getDirectoryItems(dirPath: string): DirectoryItem[] {
  if (!existsSync(dirPath)) {
    return [];
  }

  const items: DirectoryItem[] = [];
  const entries = readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isFile()) {
      const fullPath = join(dirPath, entry.name);
      const stats = statSync(fullPath);
      
      items.push({
        name: entry.name,
        path: fullPath,
        size: stats.size,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
      });
    }
  }

  return items;
}

/**
 * Delete a file
 */
export function deleteFile(filePath: string): void {
  if (existsSync(filePath)) {
    unlinkSync(filePath);
  }
}

