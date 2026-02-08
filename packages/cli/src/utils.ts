import chalk from 'chalk';
import ora, { Ora } from 'ora';

export function log(message: string): void {
  console.log(message);
}

export function success(message: string): void {
  console.log(chalk.green('✓ ') + message);
}

export function error(message: string): void {
  console.log(chalk.red('✗ ') + message);
}

export function warning(message: string): void {
  console.log(chalk.yellow('⚠ ') + message);
}

export function info(message: string): void {
  console.log(chalk.blue('ℹ ') + message);
}

export function spinner(text: string): Ora {
  return ora(text).start();
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString();
}

export function validateSubdomain(subdomain: string): boolean {
  // Subdomain should be lowercase alphanumeric with hyphens, 3-32 chars
  const regex = /^[a-z0-9]([a-z0-9-]{1,30}[a-z0-9])?$/;
  return regex.test(subdomain);
}

export function generateSubdomain(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 32);
}

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function parseInstanceUrl(url: string): string {
  // Ensure URL has protocol
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }
  return url;
}
