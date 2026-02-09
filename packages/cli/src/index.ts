#!/usr/bin/env node
import { Command } from 'commander';
import { loginCommand } from './commands/login';
import { initCommand } from './commands/init';
import { statusCommand } from './commands/status';
import { dashboardCommand } from './commands/dashboard';
import { logsCommand } from './commands/logs';
import { typegenCommand } from './commands/typegen';
import { devCommand } from './commands/dev';

const program = new Command();

program
  .name('picobase')
  .description('CLI tool for managing PicoBase instances')
  .version('0.1.0');

program
  .command('login')
  .description('Authenticate with PicoBase')
  .action(loginCommand);

program
  .command('init [project-name]')
  .description('Create a new PicoBase instance')
  .option('-t, --template <template>', 'Use a framework template (next, react, vue, svelte)')
  .action(initCommand);

program
  .command('status')
  .description('Show instance status')
  .option('-i, --instance <id>', 'Instance ID (defaults to current)')
  .action(statusCommand);

program
  .command('dashboard')
  .description('Open dashboard in browser')
  .option('-i, --instance <id>', 'Instance ID (defaults to current)')
  .action(dashboardCommand);

program
  .command('logs')
  .description('View instance logs')
  .option('-i, --instance <id>', 'Instance ID (defaults to current)')
  .option('-f, --follow', 'Follow log output')
  .option('-n, --tail <lines>', 'Number of lines to show', '100')
  .action(logsCommand);

program
  .command('typegen')
  .description('Generate TypeScript types from collection schemas')
  .option('-o, --output <path>', 'Output file path', './src/types/picobase.ts')
  .option('-i, --instance <id>', 'Instance ID (defaults to current)')
  .action(typegenCommand);

program
  .command('dev')
  .description('Start local PocketBase instance for development')
  .option('-p, --port <port>', 'Port to run on', '8090')
  .option('-a, --with-app', 'Also start your app dev server (npm run dev)')
  .option('-r, --run <command>', 'Custom command to start your app (e.g., "npm run dev")')
  .action(devCommand);

program.parse(process.argv);
