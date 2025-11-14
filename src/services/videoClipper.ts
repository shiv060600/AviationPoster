import { exec } from 'child_process';
import { promisify } from 'util';
import { join } from 'path';
import { existsSync } from 'fs';
import { config } from '../config';
import { ClipTimestamp, VideoClip } from '../types';
import { ensureDirectoryExists, getClipFilename } from '../utils/fileUtils';
import { randomUUID } from 'crypto';

const execAsync = promisify(exec);

export class VideoClipper {
  private clipsPath: string;

  constructor() {
    this.clipsPath = config.paths.clips;
    ensureDirectoryExists(this.clipsPath);
  }

  /**
   * Create a clip from a video using timestamps
   */
  async createClip(
    videoPath: string,
    timestamps: ClipTimestamp,
    videoId: string,
    originalTitle: string
  ): Promise<VideoClip> {
    if (!existsSync(videoPath)) {
      throw new Error(`Video file not found: ${videoPath}`);
    }

    const clipId = randomUUID();
    const outputPath = join(this.clipsPath, getClipFilename(clipId));
    ensureDirectoryExists(this.clipsPath);

    const { start, end } = timestamps;
    const duration = end - start;

    // Validate duration
    if (duration > config.video.maxDuration) {
      throw new Error(`Clip duration (${duration}s) exceeds maximum (${config.video.maxDuration}s)`);
    }
    if (duration < config.video.minDuration) {
      throw new Error(`Clip duration (${duration}s) is below minimum (${config.video.minDuration}s)`);
    }

    // Format timestamps for ffmpeg (HH:MM:SS or seconds)
    const startTime = this.formatTimestamp(start);
    const durationStr = this.formatTimestamp(duration);

    try {
      console.log(`Creating clip from ${startTime} for ${durationStr}`);
      
      // Use ffmpeg to extract the clip
      // -ss: start time
      // -t: duration
      // -c copy: copy codecs (faster, but may not work if cutting at non-keyframe)
      // If copy doesn't work, we'll re-encode
      const command = `ffmpeg -i "${videoPath}" -ss ${startTime} -t ${durationStr} -c:v libx264 -c:a aac -preset fast -movflags +faststart -y "${outputPath}"`;
      
      await execAsync(command);
      
      if (!existsSync(outputPath)) {
        throw new Error('Clip file was not created');
      }

      return {
        id: clipId,
        originalVideoUrl: `https://www.youtube.com/watch?v=${videoId}`,
        originalVideoTitle: originalTitle,
        clipPath: outputPath,
        startTime: start,
        endTime: end,
        duration: duration,
        title: timestamps.title || originalTitle,
        createdAt: new Date(),
      };
    } catch (error) {
      console.error(`Error creating clip:`, error);
      throw error;
    }
  }

  /**
   * Create multiple clips from a video
   */
  async createClips(
    videoPath: string,
    timestamps: ClipTimestamp[],
    videoId: string,
    originalTitle: string
  ): Promise<VideoClip[]> {
    const clips: VideoClip[] = [];
    
    for (const timestamp of timestamps) {
      try {
        const clip = await this.createClip(videoPath, timestamp, videoId, originalTitle);
        clips.push(clip);
      } catch (error) {
        console.error(`Failed to create clip for timestamp ${timestamp.start}-${timestamp.end}:`, error);
        // Continue with other clips
      }
    }
    
    return clips;
  }

  /**
   * Format seconds to HH:MM:SS or MM:SS
   */
  private formatTimestamp(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
}

