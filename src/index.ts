import { YouTubeDownloader } from './services/youtubeDownloader.js';
import { VideoClipper } from './services/videoClipper.js';
import { AINamingAgent } from './services/aiNamingAgent.js';
import { SocialUploader } from './services/socialUploader.js';
import { TimestampExtractor } from './services/timestampExtractor.js';
import { Scheduler } from './services/scheduler.js';
import { VideoClip } from './types';
import { ensureDirectoryExists } from './utils/fileUtils.js';
import { config } from './config';
import { validateDependencies } from './utils/checkDependencies.js';

/**
 * Main processing function - runs the daily workflow
 */
export async function processDailyContent(): Promise<void> {
  console.log('\n=== Starting Daily Content Processing ===\n');
  
  // Validate system dependencies first
  await validateDependencies();
  console.log('');
  
  const downloader = new YouTubeDownloader();
  const clipper = new VideoClipper();
  const namingAgent = new AINamingAgent();
  const uploader = new SocialUploader();
  const timestampExtractor = new TimestampExtractor();

  try {
    // Step 1: Get latest videos from channel
    console.log('Step 1: Fetching latest videos from channel...');
    const latestVideos = await downloader.getLatestVideos(5);
    
    if (latestVideos.length === 0) {
      console.log('No videos found. Exiting.');
      return;
    }

    console.log(`Found ${latestVideos.length} video(s). Processing first video...`);
    const video = latestVideos[0];
    console.log(`Video: ${video.title}`);
    console.log(`Duration: ${video.duration}s`);

    // Step 2: Download the video
    console.log('\nStep 2: Downloading video...');
    ensureDirectoryExists(config.paths.downloads);
    const videoPath = await downloader.downloadVideo(video.url, video.id);
    console.log(`Video downloaded: ${videoPath}`);

    // Step 3: Extract timestamps
    console.log('\nStep 3: Extracting timestamps...');
    let timestamps = timestampExtractor.extractFromDescription(video);
    
    // If no timestamps found in description, generate automatic ones
    if (timestamps.length === 0) {
      console.log('No timestamps found in description. Generating automatic timestamps...');
      timestamps = timestampExtractor.generateAutomaticTimestamps(
        video.duration,
        3, // Generate 3 clips
        config.video.maxDuration
      );
    }

    if (timestamps.length === 0) {
      console.log('No valid timestamps found. Exiting.');
      return;
    }

    console.log(`Found ${timestamps.length} timestamp(s) to process:`);
    timestamps.forEach((ts, i) => {
      console.log(`  ${i + 1}. ${ts.start}s - ${ts.end}s (${ts.end - ts.start}s)`);
    });

    // Step 4: Create clips
    console.log('\nStep 4: Creating video clips...');
    const clips: VideoClip[] = await clipper.createClips(
      videoPath,
      timestamps,
      video.id,
      video.title
    );

    if (clips.length === 0) {
      console.log('No clips created. Exiting.');
      return;
    }

    console.log(`Created ${clips.length} clip(s)`);

    // Step 5: Generate titles and descriptions with AI
    console.log('\nStep 5: Generating titles and descriptions with AI...');
    for (const clip of clips) {
      try {
        clip.title = await namingAgent.generateTitle(clip);
        clip.description = await namingAgent.generateDescription(clip);
        console.log(`Clip titled: "${clip.title}"`);
      } catch (error) {
        console.error(`Error generating title for clip:`, error);
      }
    }

    // Step 6: Upload to social media
    console.log('\nStep 6: Uploading to social media...');
    const uploadResults: Array<{ clip: VideoClip; result: any }> = [];

    for (const clip of clips) {
      console.log(`\nUploading clip: ${clip.title}`);
      
      // Upload to both platforms
      const result = await uploader.uploadToBoth(clip);
      uploadResults.push({ clip, result });
      
      if (result.success) {
        console.log(`✓ Successfully uploaded "${clip.title}"`);
      } else {
        console.error(`✗ Failed to upload "${clip.title}": ${result.error}`);
      }
    }

    // Summary
    console.log('\n=== Processing Complete ===');
    console.log(`Videos processed: 1`);
    console.log(`Clips created: ${clips.length}`);
    console.log(`Successful uploads: ${uploadResults.filter(r => r.result.success).length}`);
    console.log(`Failed uploads: ${uploadResults.filter(r => !r.result.success).length}`);

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

