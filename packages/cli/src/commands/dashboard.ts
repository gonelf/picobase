import { config } from '../config';
import { error, success } from '../utils';
import { exec } from 'child_process';

interface DashboardOptions {
  instance?: string;
}

export async function dashboardCommand(options?: DashboardOptions): Promise<void> {
  try {
    const instanceConfig = options?.instance
      ? config.getInstance(options.instance)
      : config.getCurrentInstance();

    if (!instanceConfig) {
      error('No instance found. Run: picobase init');
      process.exit(1);
    }

    const dashboardUrl = `https://picobase.com/dashboard/projects/${instanceConfig.id}`;

    success(`Opening dashboard: ${dashboardUrl}`);

    // Open URL in default browser
    const command =
      process.platform === 'win32'
        ? `start ${dashboardUrl}`
        : process.platform === 'darwin'
        ? `open ${dashboardUrl}`
        : `xdg-open ${dashboardUrl}`;

    exec(command, (err) => {
      if (err) {
        error('Failed to open browser. Please visit: ' + dashboardUrl);
      }
    });
  } catch (err: any) {
    error(err.message || 'An error occurred');
    process.exit(1);
  }
}
