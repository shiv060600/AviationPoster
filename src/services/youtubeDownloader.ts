import { join } from 'path';
import { config } from '../config';
import { YouTubeVideo } from '../types';
import { ensureDirectoryExists, getVideoFilename } from '../utils/fileUtils';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class YouTubeDownloader {
  private downloadPath: string;

  constructor() {
    this.downloadPath = config.paths.downloads;
    ensureDirectoryExists(this.downloadPath);
  }

  /**
   * Get latest videos from the channel
   */
  async getLatestVideos(limit: number = 5): Promise<YouTubeVideo[]> {
    try {
      // Use yt-dlp to get channel videos
      const channelUrl = config.youtube.channelUrl;
      const command = `yt-dlp --flat-playlist --print "%(id)s|%(title)s|%(duration)s|%(upload_date)s" --playlist-end ${limit} "${channelUrl}"`;
      
      const { stdout } = await execAsync(command);
      const lines = stdout.trim().split('\n').filter(line => line.trim());
      
      const videos: YouTubeVideo[] = [];
      
      for (const line of lines) {
        const [id, title, duration, uploadDate] = line.split('|') as [string, string, string, string];
        if (id && title) {
          videos.push({
            id: id.trim(),
            title: title.trim(),
            url: `https://www.youtube.com/watch?v=${id.trim()}`,
            duration: this.parseDuration(duration?.trim() || '0'),
            uploadDate: uploadDate?.trim() || new Date().toISOString().split('T')[0],
          });
        }
      }
      
      return videos;
    } catch (error) {
      console.error('Error fetching latest videos:', error);
      throw error;
    }
  }

  /**
   * Download a video from YouTube
   */
  async downloadVideo(videoUrl: string, videoId: string): Promise<string> {
    try {
      ensureDirectoryExists(this.downloadPath);
      const outputPath = join(this.downloadPath, getVideoFilename(videoId));
      
      console.log(`Downloading video: ${videoUrl}`);
      
      const quality = config.video.quality.replace('p', '');
      const command = `yt-dlp -f "bestvideo[height<=${quality}]+bestaudio/best[height<=${quality}]" -o "${outputPath}" --no-playlist --merge-output-format mp4 "${videoUrl}"`;
      
      await execAsync(command);
      
      console.log(`Video downloaded: ${outputPath}`);
      return outputPath;
    } catch (error) {
      console.error(`Error downloading video ${videoUrl}:`, error);
      throw error;
    }
  }

  /**
   * Get video info without downloading
   */
  async getVideoInfo(videoUrl: string): Promise<YouTubeVideo> {
    try {
      const command = `yt-dlp --print "%(id)s|%(title)s|%(duration)s|%(upload_date)s|%(description)s|%(thumbnail)s" "${videoUrl}"`;
      const { stdout } = await execAsync(command);
      
      const [id, title, duration, uploadDate, description, thumbnail] = stdout.trim().split('|');
      
      return {
        id: id?.trim() || '',
        title: title?.trim() || 'Unknown',
        url: videoUrl,
        duration: this.parseDuration(duration?.trim() || '0'),
        uploadDate: uploadDate?.trim() || new Date().toISOString().split('T')[0],
        description: description?.trim(),
        thumbnail: thumbnail?.trim(),
      };
    } catch (error) {
      console.error(`Error getting video info for ${videoUrl}:`, error);
      throw error;
    }
  }

  /**
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

