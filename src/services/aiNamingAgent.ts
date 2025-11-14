import OpenAI from 'openai';
import { config } from '../config';
import { VideoClip } from '../types';

export class AINamingAgent {
  private openai: OpenAI | null = null;

  constructor() {
    if (config.openai.apiKey) {
      this.openai = new OpenAI({
        apiKey: config.openai.apiKey,
      });
    } else {
      console.warn('OpenAI API key not set. AI naming will be disabled.');
    }
  }

  /**
   * Generate an engaging title for a video clip
   */
  async generateTitle(clip: VideoClip): Promise<string> {
    if (!this.openai) {
      return this.fallbackTitle(clip);
    }

    try {
      const prompt = this.buildNamingPrompt(clip);
      
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at creating engaging, viral-worthy titles for aviation video clips on social media platforms like Instagram Reels and TikTok. Create short, punchy, attention-grabbing titles that include relevant aviation keywords.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.8,
        max_tokens: 100,
      });

      const title = completion.choices[0]?.message?.content?.trim();
      
      if (title) {
        // Clean up the title (remove quotes, trim, limit length)
        return this.sanitizeTitle(title);
      }
      
      return this.fallbackTitle(clip);
    } catch (error) {
      console.error('Error generating AI title:', error);
      return this.fallbackTitle(clip);
    }
  }

  /**
   * Generate a description for the clip
   */
  async generateDescription(clip: VideoClip): Promise<string> {
    if (!this.openai) {
      return this.fallbackDescription(clip);
    }

    try {
      const prompt = `Create a short, engaging description (2-3 sentences) for this aviation video clip:
        Original Video: ${clip.originalVideoTitle}
        Clip Duration: ${clip.duration} seconds
        Start Time: ${clip.startTime}s
            
        Include relevant hashtags for aviation content.`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at creating engaging social media descriptions for aviation content. Include relevant hashtags.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 200,
      });

      const description = completion.choices[0]?.message?.content?.trim();
      return description || this.fallbackDescription(clip);
    } catch (error) {
      console.error('Error generating AI description:', error);
      return this.fallbackDescription(clip);
    }
  }

  /**
   * Build the prompt for title generation
   */
  private buildNamingPrompt(clip: VideoClip): string {
    return `Create an engaging, viral-worthy title for this aviation video clip:

        Original Video Title: ${clip.originalVideoTitle}
        Clip Duration: ${clip.duration} seconds
        Start Time: ${clip.startTime} seconds

        Requirements:
        - Maximum 100 characters
        - Attention-grabbing and engaging
        - Include relevant aviation keywords
        - Optimized for Instagram Reels/TikTok
        - Should make viewers want to watch

        Return ONLY the title, no quotes or additional text.`;
  }

  /**
   * Sanitize and format the AI-generated title
   */
  private sanitizeTitle(title: string): string {
    return title
      .replace(/^["']|["']$/g, '') // Remove surrounding quotes
      .trim()
      .substring(0, 100); // Limit length
  }

  /**
   * Fallback title generation (if AI fails)
   */
  private fallbackTitle(clip: VideoClip): string {
    // Extract key words from original title
    const words = clip.originalVideoTitle
      .split(/[\s\-_]+/)
      .filter(word => word.length > 2)
      .slice(0, 5)
      .join(' ');
    
    return `${words} - Aviation Clip` || 'Aviation Video Clip';
  }

  /**
   * Fallback description generation
   */
  private fallbackDescription(clip: VideoClip): string {
    return `Amazing aviation moment from ${clip.originalVideoTitle}
        #aviation #airplane #aircraft #flying #aviationlovers #pilot #avgeek #flight #airplanes #aviationphotography`;
  }
}

