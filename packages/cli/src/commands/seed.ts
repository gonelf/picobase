import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { config } from '../config';
import { error, success, info, warning, spinner, log } from '../utils';

interface SeedOptions {
  instance?: string;
  reset?: boolean;
  file?: string;
}

export interface SeedConfig {
  collections: Record<string, Record<string, any>[]>;
}

export async function seedCommand(options?: SeedOptions): Promise<void> {
  try {
    // Resolve instance
    const instanceConfig = options?.instance
      ? config.getInstance(options.instance)
      : config.getCurrentInstance();

    // Fall back to localhost for local dev
    const instanceUrl = instanceConfig?.url || 'http://127.0.0.1:8090';
    const apiKey = instanceConfig?.apiKey;

    // Load seed file
    const seedData = await loadSeedFile(options?.file);
    if (!seedData) {
      return;
    }

    const collectionNames = Object.keys(seedData.collections);
    if (collectionNames.length === 0) {
      warning('Seed file has no collections defined');
      return;
    }

    info(`Seeding ${collectionNames.length} collection(s) into ${instanceUrl}`);
    log('');

    const headers: Record<string, string> = {};
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    // Reset collections if --reset flag is set
    if (options?.reset) {
      const resetSpin = spinner('Clearing existing data...');
      try {
        for (const collectionName of collectionNames) {
          await clearCollection(instanceUrl, collectionName, headers);
        }
        resetSpin.succeed('Existing data cleared');
      } catch (err: any) {
        resetSpin.warn('Some collections could not be cleared (they may not exist yet)');
      }
    }

    // Seed each collection
    let totalRecords = 0;
    let totalErrors = 0;

    for (const collectionName of collectionNames) {
      const records = seedData.collections[collectionName];
      const spin = spinner(`Seeding ${collectionName} (${records.length} records)...`);

      let created = 0;
      let errors = 0;

      for (const record of records) {
        try {
          await axios.post(
            `${instanceUrl}/api/collections/${collectionName}/records`,
            record,
            { headers, timeout: 10000 }
          );
          created++;
        } catch (err: any) {
          errors++;
          const msg = err.response?.data?.message || err.message;
          // Don't stop on individual record errors — log and continue
          if (errors === 1) {
            spin.text = `Seeding ${collectionName} (${created}/${records.length}, ${errors} error(s))...`;
          }
        }
      }

      totalRecords += created;
      totalErrors += errors;

      if (errors === 0) {
        spin.succeed(`${collectionName}: ${created} record(s) created`);
      } else if (created > 0) {
        spin.warn(`${collectionName}: ${created} created, ${errors} failed`);
      } else {
        spin.fail(`${collectionName}: all ${errors} record(s) failed`);
      }
    }

    log('');
    if (totalErrors === 0) {
      success(`Seeding complete: ${totalRecords} record(s) created`);
    } else {
      warning(`Seeding complete: ${totalRecords} created, ${totalErrors} failed`);
    }
  } catch (err: any) {
    error(err.message || 'An error occurred during seeding');
    process.exit(1);
  }
}

async function loadSeedFile(filePath?: string): Promise<SeedConfig | null> {
  const cwd = process.cwd();

  // If explicit path provided, use that
  if (filePath) {
    const resolved = path.resolve(filePath);
    if (!fs.existsSync(resolved)) {
      error(`Seed file not found: ${resolved}`);
      process.exit(1);
    }
    return loadFile(resolved);
  }

  // Auto-detect seed file
  const candidates = [
    'picobase.seed.ts',
    'picobase.seed.js',
    'picobase.seed.json',
  ];

  for (const candidate of candidates) {
    const candidatePath = path.join(cwd, candidate);
    if (fs.existsSync(candidatePath)) {
      info(`Found seed file: ${candidate}`);
      return loadFile(candidatePath);
    }
  }

  error('No seed file found. Create one of:');
  log('  - picobase.seed.ts');
  log('  - picobase.seed.js');
  log('  - picobase.seed.json');
  log('');
  log('Example (picobase.seed.json):');
  log('  {');
  log('    "collections": {');
  log('      "posts": [');
  log('        { "title": "First Post", "content": "Hello world", "published": true }');
  log('      ]');
  log('    }');
  log('  }');
  process.exit(1);
}

async function loadFile(filePath: string): Promise<SeedConfig> {
  const ext = path.extname(filePath);

  if (ext === '.json') {
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);
    return validateSeedConfig(data);
  }

  if (ext === '.ts' || ext === '.js') {
    // For .ts files, try tsx/ts-node, or fall back to requiring .js
    try {
      // Try to require the file directly (works for .js, or if ts-node/tsx is registered)
      const resolved = require.resolve(filePath);
      delete require.cache[resolved]; // Clear cache for re-runs
      const mod = require(resolved);
      const data = mod.default || mod;
      return validateSeedConfig(data);
    } catch (requireErr: any) {
      // If .ts file and require failed, try to compile with tsx
      if (ext === '.ts') {
        try {
          const { execSync } = require('child_process');
          // Try tsx first, then ts-node
          const output = execSync(`npx tsx -e "const m = require('${filePath}'); console.log(JSON.stringify(m.default || m))"`, {
            encoding: 'utf-8',
            cwd: path.dirname(filePath),
            timeout: 15000,
          });
          const data = JSON.parse(output.trim());
          return validateSeedConfig(data);
        } catch {
          error(`Could not load TypeScript seed file. Install tsx: npm install -D tsx`);
          process.exit(1);
        }
      }
      throw requireErr;
    }
  }

  error(`Unsupported seed file format: ${ext}`);
  process.exit(1);
}

function validateSeedConfig(data: any): SeedConfig {
  if (!data || typeof data !== 'object') {
    error('Seed file must export an object with a "collections" property');
    process.exit(1);
  }

  if (!data.collections || typeof data.collections !== 'object') {
    error('Seed file must have a "collections" property containing collection data');
    process.exit(1);
  }

  for (const [name, records] of Object.entries(data.collections)) {
    if (!Array.isArray(records)) {
      error(`Collection "${name}" must be an array of records`);
      process.exit(1);
    }
  }

  return data as SeedConfig;
}

async function clearCollection(
  instanceUrl: string,
  collectionName: string,
  headers: Record<string, string>
): Promise<void> {
  try {
    // Fetch all records and delete them one by one
    // PocketBase doesn't have a bulk delete endpoint
    const response = await axios.get(
      `${instanceUrl}/api/collections/${collectionName}/records`,
      {
        headers,
        params: { perPage: 500 },
        timeout: 10000,
      }
    );

    const records = response.data?.items || [];
    for (const record of records) {
      await axios.delete(
        `${instanceUrl}/api/collections/${collectionName}/records/${record.id}`,
        { headers, timeout: 10000 }
      );
    }
  } catch {
    // Collection may not exist yet — that's fine
  }
}
