import * as fs from 'fs';
import * as path from 'path';
import { api } from '../api';
import { config } from '../config';
import { error, spinner, success } from '../utils';

interface TypegenOptions {
  output?: string;
  instance?: string;
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

    const spin = spinner('Fetching collection schemas...');

    try {
      const collections = await api.getCollections(instanceConfig.url, instanceConfig.apiKey);

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
  } catch (err: any) {
    error(err.message || 'An error occurred');
    process.exit(1);
  }
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
  output += `}\n`;

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
