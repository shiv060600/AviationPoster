import { readFileSync, writeFileSync, existsSync } from 'fs';
import { config } from '../config';
import { ClipQueue, QueuedClip, ClipTimestamp } from '../types';

export class ClipQueueManager {
  private queuePath: string;

  constructor() {
    this.queuePath = config.paths.queue;
  }

  /**
   * Load the clip queue from JSON file
   */
  loadQueue(): ClipQueue {
    if (!existsSync(this.queuePath)) {
      return {
        clips: [],
        lastUpdated: new Date().toISOString(),
      };
    }

    try {
      const content = readFileSync(this.queuePath, 'utf-8');
      return JSON.parse(content) as ClipQueue;
    } catch (error) {
      console.error('Error loading clip queue:', error);
      return {
        clips: [],
        lastUpdated: new Date().toISOString(),
      };
    }
  }

  /**
   * Save the clip queue to JSON file
   */
  saveQueue(queue: ClipQueue): void {
    queue.lastUpdated = new Date().toISOString();
    writeFileSync(this.queuePath, JSON.stringify(queue, null, 2), 'utf-8');
  }

  /**
   * Add clips to the queue
   */
  addClips(clips: QueuedClip[]): void {
    const queue = this.loadQueue();
    queue.clips.push(...clips);
    this.saveQueue(queue);
  }

  /**
   * Get the next clip from queue
   */
  getNextClip(): QueuedClip | null {
    const queue = this.loadQueue();
    return queue.clips.length > 0 ? queue.clips[0] : null;
  }

  /**
   * Remove a clip from queue by index
   */
  removeClip(index: number): boolean {
    const queue = this.loadQueue();
    if (index >= 0 && index < queue.clips.length) {
      queue.clips.splice(index, 1);
      this.saveQueue(queue);
      return true;
    }
    return false;
  }

  /**
   * Remove a clip from queue by videoId and timestamp
   */
  removeClipByInfo(videoId: string, timestamp: ClipTimestamp): boolean {
    const queue = this.loadQueue();
    const index = queue.clips.findIndex(
      (clip) =>
        clip.videoId === videoId &&
        clip.timestamp.start === timestamp.start &&
        clip.timestamp.end === timestamp.end
    );
    
    if (index !== -1) {
      queue.clips.splice(index, 1);
      this.saveQueue(queue);
      return true;
    }
    return false;
  }

  /**
   * Get queue size
   */
  getQueueSize(): number {
    const queue = this.loadQueue();
    return queue.clips.length;
  }

  /**
   * Clear the queue
   */
  clearQueue(): void {
    this.saveQueue({
      clips: [],
      lastUpdated: new Date().toISOString(),
    });
  }

  /**
   * Get all clips in queue
   */
  getAllClips(): QueuedClip[] {
    const queue = this.loadQueue();
    return queue.clips;
  }
}

