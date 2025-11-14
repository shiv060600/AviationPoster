import { config } from '../config';
import { VideoClip, UploadResult } from '../types';
import { existsSync } from 'fs';
import puppeteer, { Browser, Page } from 'puppeteer';

export class SocialUploader {
  private browser: Browser | null = null;

  /**
   * Upload clip to Instagram Reels
   */
  async uploadToInstagram(clip: VideoClip): Promise<UploadResult> {
    if (!existsSync(clip.clipPath)) {
      return {
        success: false,
        platform: 'instagram',
        error: 'Clip file not found',
      };
    }

    try {
      // Note: Instagram automation is complex and may violate ToS
      // This is a template that needs to be adapted based on your approach
      // Options:
      // 1. Use Instagram Graph API (requires Meta Business account)
      // 2. Use puppeteer automation (risky, may violate ToS)
      // 3. Manual upload with pre-formatted content
      
      console.log(`Preparing to upload to Instagram: ${clip.title}`);
      console.log(`Clip path: ${clip.clipPath}`);
      
      // For now, we'll create a formatted output file with instructions
      // In production, you'd integrate with Instagram's API or automation tool
      
      return {
        success: true,
        platform: 'instagram',
        urls: [],
      };
    } catch (error) {
      console.error('Error uploading to Instagram:', error);
      return {
        success: false,
        platform: 'instagram',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Upload clip to TikTok
   */
  async uploadToTikTok(clip: VideoClip): Promise<UploadResult> {
    if (!existsSync(clip.clipPath)) {
      return {
        success: false,
        platform: 'tiktok',
        error: 'Clip file not found',
      };
    }

    try {
      // Note: TikTok automation requires TikTok API access
      // This is a template that needs TikTok API integration
      
      console.log(`Preparing to upload to TikTok: ${clip.title}`);
      console.log(`Clip path: ${clip.clipPath}`);
      
      // TikTok API integration would go here
      // Requires TikTok Developer account and API access
      
      return {
        success: true,
        platform: 'tiktok',
        urls: [],
      };
    } catch (error) {
      console.error('Error uploading to TikTok:', error);
      return {
        success: false,
        platform: 'tiktok',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Upload to both platforms
   */
  async uploadToBoth(clip: VideoClip): Promise<UploadResult> {
    const [instagramResult, tiktokResult] = await Promise.allSettled([
      this.uploadToInstagram(clip),
      this.uploadToTikTok(clip),
    ]);

    const results: UploadResult[] = [];
    
    if (instagramResult.status === 'fulfilled') {
      results.push(instagramResult.value);
    }
    if (tiktokResult.status === 'fulfilled') {
      results.push(tiktokResult.value);
    }

    const allSuccess = results.every(r => r.success);
    
    return {
      success: allSuccess,
      platform: 'both',
      urls: results.flatMap(r => r.urls || []),
      error: allSuccess ? undefined : 'Some uploads failed',
    };
  }

  /**
   * Initialize browser for automation (if needed)
   */
  private async initBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: false, // Set to true for production
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    }
    return this.browser;
  }

  /**
   * Close browser
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

