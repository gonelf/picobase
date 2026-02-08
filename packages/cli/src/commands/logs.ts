import { api } from '../api';
import { config } from '../config';
import { error, spinner, sleep } from '../utils';
import chalk from 'chalk';

interface LogsOptions {
  instance?: string;
  follow?: boolean;
  tail?: string;
}

export async function logsCommand(options?: LogsOptions): Promise<void> {
  try {
    const instanceConfig = options?.instance
      ? config.getInstance(options.instance)
      : config.getCurrentInstance();

    if (!instanceConfig) {
      error('No instance found. Run: picobase init');
      process.exit(1);
    }

    const lines = parseInt(options?.tail || '100', 10);
    const follow = options?.follow || false;

    if (follow) {
      // Follow mode - poll for new logs
      console.log(chalk.dim(`Following logs for ${instanceConfig.name}...`));
      console.log(chalk.dim('Press Ctrl+C to stop'));
      console.log('');

      let lastLogCount = 0;

      while (true) {
        try {
          const logs = await api.getLogs(instanceConfig.id, lines);

          // Only show new logs
          if (logs.length > lastLogCount) {
            const newLogs = logs.slice(lastLogCount);
            newLogs.forEach((log) => console.log(log));
            lastLogCount = logs.length;
          }

          await sleep(2000); // Poll every 2 seconds
        } catch (err: any) {
          if (err.response?.status === 404) {
            error('Instance not found');
            process.exit(1);
          }
          // Continue on other errors
        }
      }
    } else {
      // One-time fetch
      const spin = spinner('Fetching logs...');

      try {
        const logs = await api.getLogs(instanceConfig.id, lines);

        spin.stop();

        if (logs.length === 0) {
          console.log(chalk.dim('No logs available'));
        } else {
          logs.forEach((log) => console.log(log));
        }
      } catch (err: any) {
        spin.fail('Failed to fetch logs');
        error(err.response?.data?.message || err.message || 'An error occurred');
        process.exit(1);
      }
    }
  } catch (err: any) {
    error(err.message || 'An error occurred');
    process.exit(1);
  }
}
