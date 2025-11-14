import { YouTubeVideo, ClipTimestamp } from '../types';
import { config } from '../config';

/**
 * Extract interesting timestamps from video descriptions or comments
 * This is a placeholder - in practice, you might:
 * 1. Use AI to analyze video and find interesting moments
 * 2. Parse timestamps from video description
 * 3. Use user-defined timestamps
 * 4. Detect highlight moments automatically
 */
export class TimestampExtractor {
  /**
   * Extract timestamps from video description
   * Looks for patterns like "00:15", "1:23", "10:30-12:45", etc.
   */
  extractFromDescription(video: YouTubeVideo): ClipTimestamp[] {
    const timestamps: ClipTimestamp[] = [];
    
    if (!video.description) {
      return timestamps;
    }

    // Pattern to match timestamps: HH:MM:SS or MM:SS, optionally with end time
    const timestampPattern = /(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*-\s*(\d{1,2}):(\d{2})(?::(\d{2}))?)?/g;
    
    let match;
    while ((match = timestampPattern.exec(video.description)) !== null) {
      const startTime = this.parseTimestamp(match[1], match[2], match[3]);
      
      let endTime: number;
      if (match[4] && match[5]) {
        // End timestamp provided
        endTime = this.parseTimestamp(match[4], match[5], match[6]);
      } else {
        // Default duration (use max duration)
        endTime = Math.min(startTime + config.video.maxDuration, video.duration);
      }

      // Validate timestamp
      if (startTime < video.duration && endTime > startTime) {
        const duration = endTime - startTime;
        if (duration >= config.video.minDuration && duration <= config.video.maxDuration) {
          timestamps.push({
            start: startTime,
            end: endTime,
          });
        }
      }
    }

    return timestamps;
  }

  /**
   * Generate automatic timestamps (equal intervals)
   */
  generateAutomaticTimestamps(
    videoDuration: number,
    numClips: number = 3,
    clipDuration: number = config.video.maxDuration
  ): ClipTimestamp[] {
    const timestamps: ClipTimestamp[] = [];
    const interval = Math.floor(videoDuration / (numClips + 1));
    
    for (let i = 1; i <= numClips; i++) {
      const start = interval * i;
      const end = Math.min(start + clipDuration, videoDuration);
      
      if (end - start >= config.video.minDuration) {
        timestamps.push({
          start: Math.floor(start),
          end: Math.floor(end),
        });
      }
    }
    
    return timestamps;
  }

  /**
   * Parse timestamp components to seconds
   */
  private parseTimestamp(hoursOrMinutes: string, minutesOrSeconds: string, seconds?: string): number {
    const h = parseInt(hoursOrMinutes);
    const m = parseInt(minutesOrSeconds);
    const s = seconds ? parseInt(seconds) : 0;

    // If seconds component exists, format is HH:MM:SS
    // Otherwise, it's MM:SS (assume hours is actually minutes)
    if (seconds !== undefined) {
      return h * 3600 + m * 60 + s;
    } else {
      return h * 60 + m;
    }
  }

  /**
   * Extract timestamps using AI (future enhancement)
   * This would analyze video content to find interesting moments
   */
  async extractWithAI(video: YouTubeVideo): Promise<ClipTimestamp[]> {
    // Placeholder for AI-based timestamp extraction
    // Could use video analysis API or computer vision
    return [];
  }
}

