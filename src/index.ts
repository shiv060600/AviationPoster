import { YouTubeDownloader } from './services/youtubeDownloader.js';
import { AINamingAgent } from './services/aiNamingAgent.js';
import { SocialUploader } from './services/socialUploader.js';
import { Scheduler } from './services/scheduler.js';
import { ClipQueueManager } from './services/clipQueueManager.js';
import { VideoClip, ClipTimestamp, QueuedClip } from './types';
import { getDirectoryItems, deleteFile } from './utils/fileUtils.js';
import { config } from './config';
import { validateDependencies } from './utils/checkDependencies.js';

/**
 * Populate clip queue with new clips from latest videos
 */
async function populateClipQueue(): Promise<void> {
  console.log('\n=== Populating Clip Queue ===\n');
  
  const downloader = new YouTubeDownloader();
  const queueManager = new ClipQueueManager();

  // Get latest videos from channel
  console.log('Fetching latest videos from channel...');
  const latestVideos = await downloader.getLatestVideos(5);
  
  if (latestVideos.length === 0) {
    console.log('No videos found.');
    return;
  }

  console.log(`Found ${latestVideos.length} video(s)`);

  // Collect all timestamps from all videos
  const allClips: QueuedClip[] = [];
  
  for (const video of latestVideos) {
    let timestamps: ClipTimestamp[] = video.timestamps || [];
    
    // Add clips to queue
    for (const timestamp of timestamps) {
      allClips.push({
        videoId: video.id,
        videoUrl: video.url,
        videoTitle: video.title,
        timestamp,
        addedAt: new Date().toISOString(),
      });
    }
  }

  // Randomly select up to 10 clips
  const selectedClips: QueuedClip[] = [];
  const usedIndices = new Set<number>();
  const maxClips = 10;
  const targetCount = Math.min(maxClips, allClips.length);
  
  while (selectedClips.length < targetCount) {
    const randomIndex = Math.floor(Math.random() * allClips.length);
    if (!usedIndices.has(randomIndex)) {
      selectedClips.push(allClips[randomIndex]);
      usedIndices.add(randomIndex);
    }
  }

  // Add to queue
  queueManager.addClips(selectedClips);
  console.log(`Added ${selectedClips.length} clip(s) to queue`);
}

/**
 * Get current number of clips in clips directory
 */
function getCurrentClipCount(): number {
  const clips = getDirectoryItems(config.paths.clips);
  return clips.filter(item => item.name.startsWith('clip_')).length;
}

/**
 * Download a clip from queue
 */
async function downloadClipFromQueue(queuedClip: QueuedClip): Promise<VideoClip | null> {
  const downloader = new YouTubeDownloader();
  
  try {
    const clipPath = await downloader.downloadClip(
      queuedClip.videoUrl,
      queuedClip.videoId,
      queuedClip.timestamp,
      queuedClip.videoTitle
    );

    return {
      id: clipPath.split('clip_')[1]?.split('.')[0] || Date.now().toString(),
      originalVideoUrl: queuedClip.videoUrl,
      originalVideoTitle: queuedClip.videoTitle,
      clipPath,
      startTime: queuedClip.timestamp.start,
      endTime: queuedClip.timestamp.end,
      duration: queuedClip.timestamp.end - queuedClip.timestamp.start,
      title: queuedClip.videoTitle,
      createdAt: new Date(),
    };
  } catch (error) {
    console.error(`Error downloading clip:`, error);
    return null;
  }
}

/**
 * Main processing function - processes one clip
 */
export async function processDailyContent(): Promise<void> {
  console.log('\n=== Starting Daily Content Processing ===\n');
  
  // Validate system dependencies first
  await validateDependencies();
  console.log('');
  
  const queueManager = new ClipQueueManager();
  const namingAgent = new AINamingAgent();
  const uploader = new SocialUploader();

  try {
    // Step 1: Check current clip count
    const currentClipCount = getCurrentClipCount();
    console.log(`Current clips in directory: ${currentClipCount}`);
    
    // Step 2: Populate queue if needed
    const queueSize = queueManager.getQueueSize();
    if (queueSize === 0) {
      console.log('Clip queue is empty. Populating from latest videos...');
      await populateClipQueue();
    }

    // Step 3: Check if we need to download more clips
    if (currentClipCount < config.video.maxClips) {
      const clipsNeeded = config.video.maxClips - currentClipCount;
      console.log(`\nNeed ${clipsNeeded} more clip(s). Downloading from queue...`);
      
      for (let i = 0; i < clipsNeeded; i++) {
        const queuedClip = queueManager.getNextClip();
        if (!queuedClip) {
          console.log('No more clips in queue. Populating...');
          await populateClipQueue();
          const newQueuedClip = queueManager.getNextClip();
          if (!newQueuedClip) {
            console.log('No clips available. Exiting.');
            return;
          }
          // Download the new clip
          const clip = await downloadClipFromQueue(newQueuedClip);
          if (clip) {
            queueManager.removeClipByInfo(newQueuedClip.videoId, newQueuedClip.timestamp);
          }
          break;
        }
        
        const clip = await downloadClipFromQueue(queuedClip);
        if (clip) {
          queueManager.removeClipByInfo(queuedClip.videoId, queuedClip.timestamp);
        }
      }
    }

    // Step 4: Get oldest clip to process
    const clips = getDirectoryItems(config.paths.clips);
    const clipFiles = clips.filter(item => item.name.startsWith('clip_'));
    
    if (clipFiles.length === 0) {
      console.log('No clips available to process. Exiting.');
      return;
    }

    // Sort by creation date (oldest first)
    clipFiles.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    const oldestClip = clipFiles[0];

    console.log(`\nProcessing clip: ${oldestClip.name}`);

    // Step 5: Create VideoClip object (we need to get metadata)
    // For now, we'll use a simplified approach
    const clip: VideoClip = {
      id: oldestClip.name.replace('clip_', '').replace('.mp4', ''),
      originalVideoUrl: '',
      originalVideoTitle: '',
      clipPath: oldestClip.path,
      startTime: 0,
      endTime: 0,
      duration: 0,
      title: oldestClip.name,
      createdAt: oldestClip.createdAt,
    };

    // Step 6: Generate title and description with AI
    console.log('Generating title and description with AI...');
    try {
      clip.title = await namingAgent.generateTitle(clip);
      clip.description = await namingAgent.generateDescription(clip);
      console.log(`Clip titled: "${clip.title}"`);
    } catch (error) {
      console.error(`Error generating title:`, error);
    }

    // Step 7: Upload to social media
    console.log('\nUploading to social media...');
    const result = await uploader.uploadToBoth(clip);
    
    if (result.success) {
      console.log(`✓ Successfully uploaded "${clip.title}"`);
      
      // Step 8: Delete clip after successful upload
      console.log(`Deleting clip: ${oldestClip.path}`);
      deleteFile(oldestClip.path);
      
      // Step 9: Download next clip from queue
      const nextQueuedClip = queueManager.getNextClip();
      if (nextQueuedClip) {
        console.log('\nDownloading next clip from queue...');
        const newClip = await downloadClipFromQueue(nextQueuedClip);
        if (newClip) {
          queueManager.removeClipByInfo(nextQueuedClip.videoId, nextQueuedClip.timestamp);
          console.log(`✓ Downloaded new clip: ${newClip.clipPath}`);
        }
      }
    } else {
      console.error(`✗ Failed to upload "${clip.title}": ${result.error}`);
    }

    // Summary
    console.log('\n=== Processing Complete ===');
    console.log(`Clips in directory: ${getCurrentClipCount()}`);
    console.log(`Clips in queue: ${queueManager.getQueueSize()}`);

    // Cleanup
    await uploader.close();
    
  } catch (error) {
    console.error('Error in daily processing:', error);
    throw error;
  }
}

/**
 * Main entry point
 */
async function main() {
  // Check dependencies before starting
  try {
    await validateDependencies();
    console.log('');
  } catch (error) {
    console.error('\n❌ Dependency check failed:');
    console.error(error instanceof Error ? error.message : String(error));
    console.error('\nPlease install the missing dependencies and try again.\n');
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const runScheduled = args.includes('--schedule');

  if (runScheduled) {
    // Run as scheduled service
    console.log('Starting scheduled service...');
    const scheduler = new Scheduler();
    scheduler.setProcessFunction(processDailyContent);
    scheduler.start();
    
    // Keep process alive
    process.on('SIGINT', () => {
      console.log('\nShutting down scheduler...');
      scheduler.stop();
      process.exit(0);
    });
  } else {
    // Run once immediately
    await processDailyContent();
  }
}

// Run main function (this file is the entry point)
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});


