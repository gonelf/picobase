import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';
import axios from 'axios';
import chalk from 'chalk';
import { api } from '../api';
import { config } from '../config';
import { log, success, error, warning, info } from '../utils';

interface DoctorOptions {
  instance?: string;
}

interface CheckResult {
  status: 'pass' | 'warn' | 'fail';
  message: string;
  detail?: string;
}

export async function doctorCommand(options?: DoctorOptions): Promise<void> {
  log('');
  log(chalk.bold('  Checking configuration...\n'));

  const results: CheckResult[] = [];

  // 1. Auth token check
  results.push(checkAuthToken());

  // 2. Current instance check
  const instanceResult = checkCurrentInstance(options);
  results.push(instanceResult);

  // 3-4. Instance reachability + API key (only if instance is configured)
  const instanceConfig = options?.instance
    ? config.getInstance(options.instance)
    : config.getCurrentInstance();

  if (instanceConfig) {
    results.push(await checkInstanceReachable(instanceConfig.url));
    results.push(await checkApiKey(instanceConfig.url, instanceConfig.apiKey));
  }

  // 5. Environment variables file
  results.push(checkEnvFile());

  // 6. Node.js version
  results.push(checkNodeVersion());

  // 7. Types file
  results.push(checkTypesFile());

  // 8. PocketBase binary
  results.push(checkPocketBaseBinary());

  // 9. Package versions
  results.push(checkPackageVersions());

  // Print results
  let passes = 0;
  let warnings = 0;
  let failures = 0;

  for (const result of results) {
    switch (result.status) {
      case 'pass':
        log(chalk.green('  ✓ ') + result.message);
        passes++;
        break;
      case 'warn':
        log(chalk.yellow('  ⚠ ') + result.message);
        if (result.detail) {
          log(chalk.dim('    ' + result.detail));
        }
        warnings++;
        break;
      case 'fail':
        log(chalk.red('  ✗ ') + result.message);
        if (result.detail) {
          log(chalk.dim('    ' + result.detail));
        }
        failures++;
        break;
    }
  }

  log('');

  if (failures > 0) {
    error(`${failures} check(s) failed, ${warnings} warning(s)`);
    process.exit(1);
  } else if (warnings > 0) {
    log(chalk.yellow(`  All checks passed with ${warnings} warning(s)`));
  } else {
    log(chalk.green.bold('  All checks passed!'));
  }

  log('');
}

function checkAuthToken(): CheckResult {
  const token = config.getAuthToken();
  if (!token) {
    return {
      status: 'fail',
      message: 'Auth token missing',
      detail: 'Run: picobase login',
    };
  }

  // Check if token looks like a JWT (3 base64 segments)
  const parts = token.split('.');
  if (parts.length === 3) {
    try {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        return {
          status: 'fail',
          message: 'Auth token expired',
          detail: 'Run: picobase login',
        };
      }
    } catch {
      // Not a JWT or can't parse — just check it exists
    }
  }

  return { status: 'pass', message: 'Auth token valid' };
}

function checkCurrentInstance(options?: DoctorOptions): CheckResult {
  const instanceConfig = options?.instance
    ? config.getInstance(options.instance)
    : config.getCurrentInstance();

  if (!instanceConfig) {
    return {
      status: 'fail',
      message: 'No current instance set',
      detail: 'Run: picobase init',
    };
  }

  return {
    status: 'pass',
    message: `Current instance: ${instanceConfig.name} (${instanceConfig.url})`,
  };
}

async function checkInstanceReachable(url: string): Promise<CheckResult> {
  try {
    const response = await axios.get(`${url}/api/health`, { timeout: 10000 });
    if (response.status === 200) {
      return { status: 'pass', message: 'Instance status: running' };
    }
    return {
      status: 'warn',
      message: `Instance responded with status ${response.status}`,
    };
  } catch (err: any) {
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      return {
        status: 'fail',
        message: 'Instance unreachable',
        detail: `Could not connect to ${url}`,
      };
    }
    return {
      status: 'warn',
      message: 'Instance health check failed',
      detail: err.message,
    };
  }
}

async function checkApiKey(url: string, apiKey: string): Promise<CheckResult> {
  if (!apiKey) {
    return {
      status: 'fail',
      message: 'API key not configured',
      detail: 'Run: picobase init',
    };
  }

  const maskedKey = apiKey.substring(0, 7) + '...';

  try {
    await axios.get(`${url}/api/collections`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      timeout: 10000,
    });
    return { status: 'pass', message: `API key valid (${maskedKey})` };
  } catch (err: any) {
    if (err.response?.status === 401 || err.response?.status === 403) {
      return {
        status: 'fail',
        message: `API key invalid (${maskedKey})`,
        detail: 'Generate a new key in the dashboard or run: picobase init',
      };
    }
    // Network error — don't fail on this, instance check already covers reachability
    return {
      status: 'warn',
      message: `API key check inconclusive (${maskedKey})`,
      detail: err.message,
    };
  }
}

function checkEnvFile(): CheckResult {
  const cwd = process.cwd();
  const envFiles = ['.env.local', '.env'];
  const requiredVars = ['PICOBASE_URL', 'PICOBASE_API_KEY'];
  // Also accept prefixed variants
  const acceptedVars = [
    ...requiredVars,
    'NEXT_PUBLIC_PICOBASE_URL',
    'NEXT_PUBLIC_PICOBASE_API_KEY',
    'VITE_PICOBASE_URL',
    'VITE_PICOBASE_API_KEY',
  ];

  for (const envFile of envFiles) {
    const envPath = path.join(cwd, envFile);
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      const hasUrl = acceptedVars.some(
        (v) => v.includes('URL') && content.includes(v + '=')
      );
      const hasKey = acceptedVars.some(
        (v) => v.includes('API_KEY') && content.includes(v + '=')
      );

      if (hasUrl && hasKey) {
        return {
          status: 'pass',
          message: `${envFile} found with PICOBASE_URL and PICOBASE_API_KEY`,
        };
      }

      const missing = [];
      if (!hasUrl) missing.push('PICOBASE_URL');
      if (!hasKey) missing.push('PICOBASE_API_KEY');

      return {
        status: 'warn',
        message: `${envFile} found but missing: ${missing.join(', ')}`,
      };
    }
  }

  return {
    status: 'warn',
    message: 'No .env.local or .env file found',
    detail: 'Run: picobase init to create one',
  };
}

function checkNodeVersion(): CheckResult {
  const version = process.version; // e.g., "v20.11.0"
  const major = parseInt(version.slice(1).split('.')[0], 10);

  if (major >= 18) {
    return { status: 'pass', message: `Node.js ${version}` };
  }

  return {
    status: 'warn',
    message: `Node.js ${version} (recommended >= 18)`,
    detail: 'Some features may not work on older versions',
  };
}

function checkTypesFile(): CheckResult {
  const cwd = process.cwd();
  const defaultPath = path.join(cwd, 'src', 'types', 'picobase.ts');

  if (!fs.existsSync(defaultPath)) {
    return {
      status: 'warn',
      message: 'TypeScript types not generated',
      detail: 'Run: picobase typegen',
    };
  }

  const stat = fs.statSync(defaultPath);
  const ageMs = Date.now() - stat.mtimeMs;
  const ageHours = Math.floor(ageMs / (1000 * 60 * 60));
  const ageDays = Math.floor(ageHours / 24);

  if (ageDays > 7) {
    return {
      status: 'warn',
      message: `TypeScript types outdated (generated ${ageDays} days ago)`,
      detail: 'Run: picobase typegen (or picobase typegen --watch)',
    };
  }

  const ageLabel =
    ageHours < 1 ? 'less than 1 hour ago' : `${ageHours} hour${ageHours === 1 ? '' : 's'} ago`;

  return {
    status: 'pass',
    message: `TypeScript types up to date (last generated: ${ageLabel})`,
  };
}

function checkPocketBaseBinary(): CheckResult {
  const pbDir = path.join(os.homedir(), '.picobase', 'dev');
  const platform = os.platform();
  const filename = platform === 'win32' ? 'pocketbase.exe' : 'pocketbase';
  const pbPath = path.join(pbDir, filename);

  if (!fs.existsSync(pbPath)) {
    return {
      status: 'warn',
      message: 'PocketBase binary not found',
      detail: 'Run: picobase dev (will download automatically)',
    };
  }

  // Try to get the version
  try {
    const versionOutput = execSync(`"${pbPath}" --version`, {
      encoding: 'utf-8',
      timeout: 5000,
    }).trim();
    // PocketBase outputs something like "pocketbase version 0.22.0"
    const versionMatch = versionOutput.match(/(\d+\.\d+\.\d+)/);
    const currentVersion = versionMatch ? versionMatch[1] : 'unknown';

    return {
      status: 'pass',
      message: `PocketBase binary v${currentVersion}`,
    };
  } catch {
    return {
      status: 'pass',
      message: 'PocketBase binary found',
    };
  }
}

function checkPackageVersions(): CheckResult {
  const cwd = process.cwd();
  const pkgPath = path.join(cwd, 'package.json');

  if (!fs.existsSync(pkgPath)) {
    return {
      status: 'warn',
      message: 'No package.json found in current directory',
    };
  }

  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

    const clientVersion = allDeps['@picobase_app/client'];
    const reactVersion = allDeps['@picobase_app/react'];

    if (!clientVersion && !reactVersion) {
      return {
        status: 'warn',
        message: 'No PicoBase packages found in dependencies',
        detail: 'Run: npm install @picobase_app/client',
      };
    }

    if (clientVersion && reactVersion && clientVersion !== reactVersion) {
      return {
        status: 'warn',
        message: `Package version mismatch: client@${clientVersion}, react@${reactVersion}`,
        detail: 'Update both packages to the same version',
      };
    }

    const versions = [clientVersion, reactVersion].filter(Boolean);
    return {
      status: 'pass',
      message: `PicoBase packages: ${versions.map((v) => `@${v}`).join(', ')}`,
    };
  } catch {
    return {
      status: 'warn',
      message: 'Could not parse package.json',
    };
  }
}
