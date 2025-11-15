import { join } from 'path';
import { config } from '../config.js';
import { YouTubeVideo, ClipTimestamp } from '../types.js';
import { ensureDirectoryExists, getClipFilename } from '../utils/fileUtils.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import { randomUUID } from 'crypto';

const execAsync = promisify(exec);

export class YouTubeDownloader {
  private clipsPath: string;

  constructor() {
    this.clipsPath = config.paths.clips;
    ensureDirectoryExists(this.clipsPath);
  }

  /**
   * Get latest videos from the channel
   */
  async getLatestVideos(limit: number = 5): Promise<YouTubeVideo[]> {
    try {
      // Step 1: Get video IDs quickly with flat-playlist
      const channelUrl = config.youtube.channelUrl;
      const playlistCommand = `yt-dlp --flat-playlist --print "%(id)s" --playlist-end ${limit} "${channelUrl}"`;
      
      const { stdout: playlistOutput } = await execAsync(playlistCommand);
      const videoIds = playlistOutput.trim().split('\n').filter(id => id.trim());
      
      if (videoIds.length === 0) {
        return [];
      }

      // Step 2: Fetch full metadata (including description) for each video
      const videos: YouTubeVideo[] = [];
      
      for (const videoId of videoIds) {
        try {
          const videoUrl = `https://www.youtube.com/watch?v=${videoId.trim()}`;
          const metadataCommand = `yt-dlp --dump-json --no-playlist "${videoUrl}"`;
          
          const { stdout: metadataJson } = await execAsync(metadataCommand);
          const videoData = JSON.parse(metadataJson);
          
          const id = videoData.id;
          const title = videoData.title || '';
          const duration = videoData.duration || 0;
          const uploadDate = videoData.upload_date || '';
          const description = videoData.description || '';
          
          const times = description ? this.parseDescription(description) : [];
          
          if (id && title) {
            videos.push({
              id: id.trim(),
              title: title.trim(),
              url: videoUrl,
              duration: this.parseDuration(duration.toString()),
              timestamps: times,
              uploadDate: uploadDate ? uploadDate.substring(0, 10) : new Date().toISOString().split('T')[0],
            });
          }
        } catch (parseError) {
          console.error(`Error fetching metadata for video ${videoId}:`, parseError);
          continue;
        }
      }
      
      return videos;
    } catch (error) {
      console.error('Error fetching latest videos:', error);
      throw error;
    }
  }

  /**
   * Download a clip directly from YouTube (without downloading full video)
   * Uses yt-dlp to get stream URL, then ffmpeg to download just the segment
   */
  async downloadClip(
    videoUrl: string,
    videoId: string,
    timestamp: ClipTimestamp,
    videoTitle: string
  ): Promise<string> {
    try {
      ensureDirectoryExists(this.clipsPath);
      const clipId = randomUUID();
      const outputPath = join(this.clipsPath, getClipFilename(clipId));
      
      const { start, end } = timestamp;
      const duration = end - start;
      
      // Format timestamps for ffmpeg
      const startTime = this.formatTimestamp(start);
      const durationStr = this.formatTimestamp(duration);
      
      console.log(`Downloading clip from ${videoUrl} (${startTime} for ${durationStr})`);
      
      const quality = config.video.quality.replace('p', '');
      
      // Get the best stream URL using yt-dlp
      const getUrlCommand = `yt-dlp -f "bestvideo[height<=${quality}]+bestaudio/best[height<=${quality}]" -g "${videoUrl}"`;
      const { stdout: streamUrl } = await execAsync(getUrlCommand);
      const url = streamUrl.trim().split('\n')[0]; // Get first URL (video or audio)
      
      // Use ffmpeg to download just the segment
      // -ss: start time, -t: duration, -c copy: copy codecs (faster)
      const downloadCommand = `ffmpeg -ss ${startTime} -i "${url}" -t ${durationStr} -c:v libx264 -c:a aac -preset fast -movflags +faststart -y "${outputPath}"`;
      
      await execAsync(downloadCommand);
      
      console.log(`Clip downloaded: ${outputPath}`);
      return outputPath;
    } catch (error) {
      console.error(`Error downloading clip from ${videoUrl}:`, error);
      throw error;
    }
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

  /*
  * Parse Description using regex
  */
  private parseDescription(descriptionStr: string): Array<ClipTimestamp>{
    if (!descriptionStr) return [];
    
    const lines = descriptionStr.split('\n');
    const timestamps: number[] = [];
    const timestampsRegex = /^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*\|\s*/;
    
    for (const line of lines) {
      const match = line.match(timestampsRegex);

      if(match){
        let totalSeconds: number;

        if(match[3] !== undefined){
          const hours = parseInt(match[1],10);
          const minutes = parseInt(match[2],10);
          const seconds = parseInt(match[3],10);

          totalSeconds = (hours * 3600) + (minutes*60) + seconds;
        } else{
          const minutes = parseInt(match[1],10);
          const seconds = parseInt(match[2],10);

          totalSeconds = (minutes * 60 + seconds);
        }

        timestamps.push(totalSeconds);
      }
    }

    const pairs: Array<ClipTimestamp> = [];
    for(let i = 0; i < timestamps.length - 1; i++){
      pairs.push({start: timestamps[i], end: timestamps[i+1]});
    }

    return pairs;
  }

  /*
   * Parse duration string (HH:MM:SS or MM:SS) to seconds
   */
  private parseDuration(durationStr: string): number {
    if (!durationStr) return 0;
    
    // If it's already a number (seconds)
    if (!isNaN(Number(durationStr))) {
      return parseInt(durationStr);
    }
    
    // Parse HH:MM:SS or MM:SS format
    const parts = durationStr.split(':').map(Number);
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }
    
    return 0;
  }
}

