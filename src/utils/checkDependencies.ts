import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Check if a command exists in the system PATH
 */
async function commandExists(command: string): Promise<boolean> {
  try {
    const { stdout } = await execAsync(`${command} --version`);
    return stdout.trim().length > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Check if yt-dlp is installed
 */
export async function checkYtDlp(): Promise<{ installed: boolean; version?: string }> {
  try {
    const { stdout } = await execAsync('yt-dlp --version');
    return {
      installed: true,
      version: stdout.trim(),
    };
  } catch (error) {
    return {
      installed: false,
    };
  }
}

/**
 * Check if ffmpeg is installed
 */
export async function checkFfmpeg(): Promise<{ installed: boolean; version?: string }> {
  try {
    const { stdout } = await execAsync('ffmpeg -version');
    // Extract version from first line
    const versionLine = stdout.split('\n')[0];
    const versionMatch = versionLine.match(/version\s+([^\s]+)/i);
    return {
      installed: true,
      version: versionMatch ? versionMatch[1] : 'unknown',
    };
  } catch (error) {
    return {
      installed: false,
    };
  }
}

/**
 * Check all required system dependencies
 */
export async function checkAllDependencies(): Promise<{
  ytDlp: { installed: boolean; version?: string };
  ffmpeg: { installed: boolean; version?: string };
  allInstalled: boolean;
}> {
  const [ytDlp, ffmpeg] = await Promise.all([
    checkYtDlp(),
    checkFfmpeg(),
  ]);

  const allInstalled = ytDlp.installed && ffmpeg.installed;

  return {
    ytDlp,
    ffmpeg,
    allInstalled,
  };
}

/**
 * Validate dependencies and throw error if missing
 */
export async function validateDependencies(): Promise<void> {
  const deps = await checkAllDependencies();
  
  const missing: string[] = [];
  
  if (!deps.ytDlp.installed) {
    missing.push('yt-dlp');
  }
  
  if (!deps.ffmpeg.installed) {
    missing.push('ffmpeg');
  }
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required system dependencies: ${missing.join(', ')}\n` +
      `Please install them:\n` +
      `  - macOS: brew install ${missing.join(' ')}\n` +
      `  - Linux: sudo apt install ${missing.join(' ')}\n` +
      `  - Windows: pip install yt-dlp && download ffmpeg from https://ffmpeg.org/download.html`
    );
  }
  
  console.log('✓ All system dependencies installed:');
  if (deps.ytDlp.version) {
    console.log(`  - yt-dlp: ${deps.ytDlp.version}`);
  }
  if (deps.ffmpeg.version) {
    console.log(`  - ffmpeg: ${deps.ffmpeg.version}`);
  }
}

