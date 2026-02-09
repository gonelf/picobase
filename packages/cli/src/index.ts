#!/usr/bin/env node
import { Command } from 'commander';
import { loginCommand } from './commands/login';
import { initCommand } from './commands/init';
import { statusCommand } from './commands/status';
import { dashboardCommand } from './commands/dashboard';
import { logsCommand } from './commands/logs';
import { typegenCommand } from './commands/typegen';
import { devCommand } from './commands/dev';
import { doctorCommand } from './commands/doctor';
import { seedCommand } from './commands/seed';

const program = new Command();

program
  .name('picobase')
  .description('CLI tool for managing PicoBase instances')
  .version('0.1.0')
  .addHelpText('after', `
Examples:
  picobase init my-app                 Create a new instance and project
  picobase init my-app -t react        Scaffold a React + Vite project
  picobase dev --with-app              Start PocketBase + your app together
  picobase typegen                     Generate TypeScript types from schema
  picobase doctor                      Check that everything is configured correctly
`);

program
  .command('login')
  .description('Authenticate with PicoBase')
  .addHelpText('after', `
Examples:
  picobase login                       Open browser to sign in
`)
  .action(loginCommand);

program
  .command('init [project-name]')
  .description('Create a new PicoBase instance')
  .option('-t, --template <template>', 'Use a framework template (next, react, vue, svelte)')
  .addHelpText('after', `
Examples:
  picobase init my-app                 Interactive setup (prompts for template)
  picobase init my-app -t react        React + Vite + TypeScript project
  picobase init my-app -t next         Next.js project
  picobase init my-app -t vue          Vue 3 + Vite project
  picobase init my-app -t svelte       SvelteKit project
`)
  .action(initCommand);

program
  .command('status')
  .description('Show instance status')
  .option('-i, --instance <id>', 'Instance ID (defaults to current)')
  .addHelpText('after', `
Examples:
  picobase status                      Show status of current instance
  picobase status -i inst_abc123       Show status of a specific instance
`)
  .action(statusCommand);

program
  .command('dashboard')
  .description('Open dashboard in browser')
  .option('-i, --instance <id>', 'Instance ID (defaults to current)')
  .addHelpText('after', `
Examples:
  picobase dashboard                   Open current instance dashboard
  picobase dashboard -i inst_abc123    Open a specific instance dashboard
`)
  .action(dashboardCommand);

program
  .command('logs')
  .description('View instance logs')
  .option('-i, --instance <id>', 'Instance ID (defaults to current)')
  .option('-f, --follow', 'Follow log output')
  .option('-n, --tail <lines>', 'Number of lines to show', '100')
  .addHelpText('after', `
Examples:
  picobase logs                        Show last 100 log lines
  picobase logs -f                     Follow logs in real time
  picobase logs -n 50                  Show last 50 lines
  picobase logs -f -n 20              Follow logs, starting with last 20 lines
`)
  .action(logsCommand);

program
  .command('typegen')
  .description('Generate TypeScript types from collection schemas')
  .option('-o, --output <path>', 'Output file path', './src/types/picobase.ts')
  .option('-i, --instance <id>', 'Instance ID (defaults to current)')
  .option('-w, --watch', 'Watch for schema changes and regenerate types')
  .option('--interval <seconds>', 'Poll interval in seconds for watch mode', '5')
  .addHelpText('after', `
Examples:
  picobase typegen                     Generate types to ./src/types/picobase.ts
  picobase typegen -o ./types.ts       Generate types to a custom path
  picobase typegen --watch             Regenerate types when schema changes
  picobase typegen -w --interval 10    Watch with 10-second poll interval
`)
  .action(typegenCommand);

program
  .command('dev')
  .description('Start local PocketBase instance for development')
  .option('-p, --port <port>', 'Port to run on', '8090')
  .option('-a, --with-app', 'Also start your app dev server (npm run dev)')
  .option('-r, --run <command>', 'Custom command to start your app (e.g., "npm run dev")')
  .addHelpText('after', `
Examples:
  picobase dev                         PocketBase only on :8090
  picobase dev --with-app              PocketBase + npm run dev
  picobase dev -p 9090                 PocketBase on custom port
  picobase dev --run "vite"            PocketBase + custom app command
  picobase dev -p 9090 --run "vite"    Custom port + custom command
`)
  .action(devCommand);

program
  .command('doctor')
  .description('Check that everything is set up correctly')
  .option('-i, --instance <id>', 'Instance ID (defaults to current)')
  .addHelpText('after', `
Examples:
  picobase doctor                      Run all diagnostic checks
  picobase doctor -i inst_abc123       Check a specific instance
`)
  .action(doctorCommand);

program
  .command('seed')
  .description('Seed collections with data from a seed file')
  .option('-i, --instance <id>', 'Instance ID (defaults to current)')
  .option('-r, --reset', 'Clear existing data before seeding')
  .option('-f, --file <path>', 'Path to seed file (auto-detects picobase.seed.{ts,js,json})')
  .addHelpText('after', `
Examples:
  picobase seed                        Seed from auto-detected picobase.seed.{ts,js,json}
  picobase seed --reset                Clear data first, then seed
  picobase seed -f ./data/seed.json    Seed from a specific file
  picobase seed --reset -f seed.ts     Clear + seed from specific file
`)
  .action(seedCommand);

program.parse(process.argv);
