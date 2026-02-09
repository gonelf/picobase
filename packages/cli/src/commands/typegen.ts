import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { api } from '../api';
import { config } from '../config';
import { error, spinner, success, info, warning, sleep } from '../utils';

interface TypegenOptions {
  output?: string;
  instance?: string;
  watch?: boolean;
  interval?: string;
}

export async function typegenCommand(options?: TypegenOptions): Promise<void> {
  try {
    const instanceConfig = options?.instance
      ? config.getInstance(options.instance)
      : config.getCurrentInstance();

    if (!instanceConfig) {
      error('No instance found. Run: picobase init');
      process.exit(1);
    }

    const outputPath = path.resolve(options?.output || './src/types/picobase.ts');

    if (options?.watch) {
      await watchTypes(instanceConfig.url, instanceConfig.apiKey, outputPath, options);
    } else {
      await generateOnce(instanceConfig.url, instanceConfig.apiKey, outputPath);
    }
  } catch (err: any) {
    error(err.message || 'An error occurred');
    process.exit(1);
  }
}

async function generateOnce(instanceUrl: string, apiKey: string, outputPath: string): Promise<void> {
  const spin = spinner('Fetching collection schemas...');

  try {
    const collections = await api.getCollections(instanceUrl, apiKey);

    spin.text = 'Generating TypeScript types...';

    const types = generateTypes(collections);

    // Create output directory if it doesn't exist
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, types, 'utf-8');

    spin.succeed('Types generated successfully!');
    success(`Output: ${outputPath}`);
  } catch (err: any) {
    spin.fail('Failed to generate types');
    error(err.response?.data?.message || err.message || 'An error occurred');
    process.exit(1);
  }
}

async function watchTypes(
  instanceUrl: string,
  apiKey: string,
  outputPath: string,
  options: TypegenOptions
): Promise<void> {
  const intervalMs = Math.max(1000, parseInt(options.interval || '5', 10) * 1000);
  let lastSchemaHash = '';

  info(`Watching for schema changes (polling every ${intervalMs / 1000}s)...`);
  info(`Output: ${outputPath}`);
  info('Press Ctrl+C to stop\n');

  // Generate types once immediately on start
  try {
    const collections = await api.getCollections(instanceUrl, apiKey);
    const types = generateTypes(collections);
    lastSchemaHash = hashSchema(collections);

    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, types, 'utf-8');
    success('Initial types generated');
  } catch (err: any) {
    error(`Failed initial type generation: ${err.response?.data?.message || err.message}`);
    process.exit(1);
  }

  // Poll for changes
  while (true) {
    await sleep(intervalMs);

    try {
      const collections = await api.getCollections(instanceUrl, apiKey);
      const currentHash = hashSchema(collections);

      if (currentHash !== lastSchemaHash) {
        const types = generateTypes(collections);
        fs.writeFileSync(outputPath, types, 'utf-8');
        lastSchemaHash = currentHash;
        success(`Types regenerated — schema changed at ${new Date().toLocaleTimeString()}`);
      }
    } catch (err: any) {
      warning(`Poll failed: ${err.response?.data?.message || err.message} (will retry)`);
    }
  }
}

export function hashSchema(collections: any[]): string {
  // Hash the schema structure (excluding generated timestamps) to detect changes
  const schemaData = collections.map((c) => ({
    name: c.name,
    type: c.type,
    schema: c.schema,
  }));
  return crypto.createHash('md5').update(JSON.stringify(schemaData)).digest('hex');
}

function generateTypes(collections: any[]): string {
  let output = `/**
 * Auto-generated TypeScript types for PicoBase collections
 * Generated at: ${new Date().toISOString()}
 */

`;

  // Generate base record interface
  output += `export interface BaseRecord {
  id: string;
  created: string;
  updated: string;
}

`;

  // Generate interface for each collection
  collections.forEach((collection) => {
    const typeName = pascalCase(collection.name) + 'Record';

    output += `export interface ${typeName} extends BaseRecord {\n`;

    // Add fields from schema
    collection.schema?.forEach((field: any) => {
      const fieldName = field.name;
      const fieldType = mapFieldType(field.type, field.options);
      const optional = field.required ? '' : '?';

      output += `  ${fieldName}${optional}: ${fieldType};\n`;
    });

    output += `}\n\n`;
  });

  // Add collection names type
  output += `export type CollectionName = ${collections.map((c) => `'${c.name}'`).join(' | ')};\n\n`;

  // Add collection records mapping
  output += `export interface CollectionRecords {\n`;
  collections.forEach((collection) => {
    const typeName = pascalCase(collection.name) + 'Record';
    output += `  ${collection.name}: ${typeName};\n`;
  });
  output += `}\n\n`;

  // Generate typed client helper — this is the DX magic
  output += `// ── Typed client helper ────────────────────────────────────────────────\n`;
  output += `// Use this instead of raw createClient() to get full autocomplete on\n`;
  output += `// collection names and record types — no more magic strings!\n`;
  output += `//\n`;
  output += `// Usage:\n`;
  output += `//   import { pb } from './types/picobase'\n`;
  output += `//   const posts = await pb.collection('posts').getList()  // fully typed!\n`;
  output += `//   posts.items[0].title  // autocomplete works here\n`;
  output += `//\n\n`;

  output += `import { createClient, type PicoBaseClient, type PicoBaseClientOptions, PicoBaseCollection } from '@picobase_app/client'\n\n`;

  output += `/** PicoBase client with typed collections. */\n`;
  output += `export interface TypedPicoBaseClient extends PicoBaseClient {\n`;
  output += `  collection<K extends CollectionName>(name: K): PicoBaseCollection<CollectionRecords[K]>\n`;
  output += `  collection<T = import('@picobase_app/client').RecordModel>(name: string): PicoBaseCollection<T>\n`;
  output += `}\n\n`;

  output += `/**\n`;
  output += ` * Create a typed PicoBase client. Collections are fully typed based on your schema.\n`;
  output += ` *\n`;
  output += ` * @example\n`;
  output += ` * \`\`\`ts\n`;
  output += ` * const pb = createTypedClient()\n`;
  output += ` * const posts = await pb.collection('posts').getList(1, 20)\n`;
  output += ` * //                                ^-- autocomplete!  ^-- PostsRecord[]\n`;
  output += ` * \`\`\`\n`;
  output += ` */\n`;
  output += `export function createTypedClient(options?: PicoBaseClientOptions): TypedPicoBaseClient\n`;
  output += `export function createTypedClient(url: string, apiKey: string, options?: PicoBaseClientOptions): TypedPicoBaseClient\n`;
  output += `export function createTypedClient(...args: any[]): TypedPicoBaseClient {\n`;
  output += `  return (createClient as any)(...args) as TypedPicoBaseClient\n`;
  output += `}\n\n`;

  output += `/** Pre-configured typed client instance (reads from env vars). */\n`;
  output += `export const pb = createTypedClient()\n`;

  return output;
}

function pascalCase(str: string): string {
  return str
    .replace(/[-_](.)/g, (_, c) => c.toUpperCase())
    .replace(/^(.)/, (_, c) => c.toUpperCase());
}

function mapFieldType(type: string, options?: any): string {
  switch (type) {
    case 'text':
    case 'editor':
    case 'url':
    case 'email':
      return 'string';
    case 'number':
      return 'number';
    case 'bool':
      return 'boolean';
    case 'date':
      return 'string'; // ISO date string
    case 'select':
      if (options?.values && Array.isArray(options.values)) {
        return options.values.map((v: string) => `'${v}'`).join(' | ');
      }
      return 'string';
    case 'json':
      return 'any';
    case 'file':
      return options?.maxSelect === 1 ? 'string' : 'string[]';
    case 'relation':
      return options?.maxSelect === 1 ? 'string' : 'string[]';
    default:
      return 'any';
  }
}
