import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { error, success, info, warning, spinner } from '../utils';
import axios from 'axios';

interface DevOptions {
  port?: string;
  /** Also run the app dev server alongside PocketBase. */
  withApp?: boolean;
  /** Custom command to start the app dev server. Defaults to "npm run dev". */
  run?: string;
}

const POCKETBASE_VERSION = '0.22.0';

export async function devCommand(options?: DevOptions): Promise<void> {
  const port = options?.port || '8090';
  const pbDir = path.join(os.homedir(), '.picobase', 'dev');
  const pbPath = getPocketBasePath(pbDir);
  const dbPath = path.join(process.cwd(), 'pb_data');
  const children: ReturnType<typeof spawn>[] = [];

  function cleanup() {
    console.log('');
    info('Stopping all dev processes...');
    for (const child of children) {
      child.kill('SIGINT');
    }
    process.exit(0);
  }

  try {
    // Check if PocketBase binary exists
    if (!fs.existsSync(pbPath)) {
      info('PocketBase not found. Downloading...');
      await downloadPocketBase(pbDir);
    }

    // Create pb_data directory if it doesn't exist
    if (!fs.existsSync(dbPath)) {
      fs.mkdirSync(dbPath, { recursive: true });
    }

    success(`Starting PocketBase on http://127.0.0.1:${port}`);
    success(`Admin UI: http://127.0.0.1:${port}/_/`);

    // Start PocketBase
    const pb = spawn(pbPath, ['serve', '--http', `127.0.0.1:${port}`], {
      stdio: 'inherit',
      cwd: process.cwd(),
    });
    children.push(pb);

    pb.on('error', (err) => {
      error(`Failed to start PocketBase: ${err.message}`);
      process.exit(1);
    });

    pb.on('close', (code) => {
      if (code !== 0 && code !== null) {
        error(`PocketBase exited with code ${code}`);
        process.exit(code);
      }
    });

    // Optionally start the app dev server too (--with-app or --run)
    const appCmd = options?.run || (options?.withApp ? 'npm run dev' : null);
    if (appCmd) {
      console.log('');
      success(`Starting app dev server: ${appCmd}`);
      console.log('');

      const [cmd, ...args] = appCmd.split(' ');
      const appProcess = spawn(cmd, args, {
        stdio: 'inherit',
        cwd: process.cwd(),
        shell: true,
        env: {
          ...process.env,
          // Inject local PocketBase URL so the SDK auto-connects
          PICOBASE_URL: `http://127.0.0.1:${port}`,
          NEXT_PUBLIC_PICOBASE_URL: `http://127.0.0.1:${port}`,
          VITE_PICOBASE_URL: `http://127.0.0.1:${port}`,
        },
      });
      children.push(appProcess);

      appProcess.on('error', (err) => {
        error(`Failed to start app: ${err.message}`);
      });
    } else {
      console.log('');
      info('Tip: Run picobase dev --with-app to start both PocketBase and your app server.');
      info('     Or: picobase dev --run "npm run dev" for a custom command.');
    }

    console.log('');
    info('Press Ctrl+C to stop');
    console.log('');

    // Handle graceful shutdown
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
  } catch (err: any) {
    error(err.message || 'Failed to start development server');
    process.exit(1);
  }
}

function getPocketBasePath(pbDir: string): string {
  const platform = os.platform();
  const arch = os.arch();

  let filename = 'pocketbase';
  if (platform === 'win32') {
    filename += '.exe';
  }

  return path.join(pbDir, filename);
}

async function downloadPocketBase(pbDir: string): Promise<void> {
  const platform = os.platform();
  const arch = os.arch();

  let downloadUrl = '';

  // Determine download URL based on platform
  if (platform === 'darwin') {
    if (arch === 'arm64') {
      downloadUrl = `https://github.com/pocketbase/pocketbase/releases/download/v${POCKETBASE_VERSION}/pocketbase_${POCKETBASE_VERSION}_darwin_arm64.zip`;
    } else {
      downloadUrl = `https://github.com/pocketbase/pocketbase/releases/download/v${POCKETBASE_VERSION}/pocketbase_${POCKETBASE_VERSION}_darwin_amd64.zip`;
    }
  } else if (platform === 'linux') {
    if (arch === 'arm64') {
      downloadUrl = `https://github.com/pocketbase/pocketbase/releases/download/v${POCKETBASE_VERSION}/pocketbase_${POCKETBASE_VERSION}_linux_arm64.zip`;
    } else {
      downloadUrl = `https://github.com/pocketbase/pocketbase/releases/download/v${POCKETBASE_VERSION}/pocketbase_${POCKETBASE_VERSION}_linux_amd64.zip`;
    }
  } else if (platform === 'win32') {
    downloadUrl = `https://github.com/pocketbase/pocketbase/releases/download/v${POCKETBASE_VERSION}/pocketbase_${POCKETBASE_VERSION}_windows_amd64.zip`;
  } else {
    throw new Error(`Unsupported platform: ${platform}`);
  }

  const spin = spinner(`Downloading PocketBase v${POCKETBASE_VERSION}...`);

  try {
    // Create directory if it doesn't exist
    if (!fs.existsSync(pbDir)) {
      fs.mkdirSync(pbDir, { recursive: true });
    }

    // Download zip file
    const zipPath = path.join(pbDir, 'pocketbase.zip');
    const response = await axios.get(downloadUrl, {
      responseType: 'arraybuffer',
    });

    fs.writeFileSync(zipPath, response.data);

    // Extract (simplified - in production would use a proper unzip library)
    spin.text = 'Extracting PocketBase...';

    // Use built-in unzip command
    const { execSync } = require('child_process');
    execSync(`unzip -o "${zipPath}" -d "${pbDir}"`, { stdio: 'ignore' });

    // Make executable on Unix
    if (platform !== 'win32') {
      fs.chmodSync(getPocketBasePath(pbDir), 0o755);
    }

    // Clean up zip file
    fs.unlinkSync(zipPath);

    spin.succeed('PocketBase downloaded successfully!');
  } catch (err: any) {
    spin.fail('Failed to download PocketBase');
    throw err;
  }
}
