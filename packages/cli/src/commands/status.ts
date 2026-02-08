import { api } from '../api';
import { config } from '../config';
import { error, spinner, formatDate } from '../utils';
import chalk from 'chalk';

interface StatusOptions {
  instance?: string;
}

export async function statusCommand(options?: StatusOptions): Promise<void> {
  try {
    const instanceConfig = options?.instance
      ? config.getInstance(options.instance)
      : config.getCurrentInstance();

    if (!instanceConfig) {
      error('No instance found. Run: picobase init');
      process.exit(1);
    }

    const spin = spinner('Fetching instance status...');

    try {
      const instance = await api.getInstance(instanceConfig.id);

      spin.stop();

      console.log('');
      console.log(chalk.bold('Instance Status'));
      console.log('');
      console.log(`Name:        ${chalk.cyan(instance.name)}`);
      console.log(`Subdomain:   ${chalk.cyan(instance.subdomain)}`);
      console.log(`URL:         ${chalk.cyan(instance.url)}`);
      console.log(`Status:      ${getStatusBadge(instance.status)}`);
      console.log(`Created:     ${formatDate(instance.createdAt)}`);
      console.log(`Updated:     ${formatDate(instance.updatedAt)}`);
      console.log('');

      if (instance.status === 'stopped') {
        console.log(chalk.yellow('💡 Instance is stopped. It will auto-start on first request.'));
        console.log('');
      }
    } catch (err: any) {
      spin.fail('Failed to fetch instance status');
      error(err.response?.data?.message || err.message || 'An error occurred');
      process.exit(1);
    }
  } catch (err: any) {
    error(err.message || 'An error occurred');
    process.exit(1);
  }
}

function getStatusBadge(status: string): string {
  switch (status) {
    case 'running':
      return chalk.green('● running');
    case 'stopped':
      return chalk.yellow('○ stopped');
    case 'starting':
      return chalk.blue('◉ starting');
    case 'error':
      return chalk.red('✗ error');
    default:
      return chalk.gray(`○ ${status}`);
  }
}
