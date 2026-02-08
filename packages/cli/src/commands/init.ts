import inquirer from 'inquirer';
import * as fs from 'fs';
import * as path from 'path';
import { api } from '../api';
import { config } from '../config';
import { success, error, spinner, warning, info, validateSubdomain, generateSubdomain } from '../utils';

interface InitOptions {
  template?: string;
}

export async function initCommand(projectName?: string, options?: InitOptions): Promise<void> {
  try {
    // Check if user is logged in
    if (!config.getAuthToken()) {
      error('You must be logged in. Run: picobase login');
      process.exit(1);
    }

    // Get project name if not provided
    if (!projectName) {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'projectName',
          message: 'Project name:',
          default: 'my-project',
          validate: (input) => {
            if (!input || input.length < 1) {
              return 'Project name is required';
            }
            return true;
          },
        },
      ]);
      projectName = answers.projectName;
    }

    // Generate subdomain from project name
    const defaultSubdomain = generateSubdomain(projectName!);

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'subdomain',
        message: 'Subdomain (your-app.picobase.com):',
        default: defaultSubdomain,
        validate: (input) => {
          if (!validateSubdomain(input)) {
            return 'Subdomain must be lowercase alphanumeric with hyphens, 3-32 characters';
          }
          return true;
        },
      },
    ]);

    const spin = spinner('Creating instance...');

    try {
      // Create instance
      const instance = await api.createInstance(projectName!, answers.subdomain);

      spin.text = 'Generating API key...';

      // Create API key
      const apiKey = await api.createApiKey(instance.id, 'default');

      // Save to config
      config.addInstance({
        id: instance.id,
        name: instance.name,
        url: instance.url,
        apiKey: apiKey.key,
      });
      config.setCurrentInstance(instance.id);

      spin.succeed('Instance created successfully!');

      console.log('');
      success(`Instance URL: ${instance.url}`);
      success(`API Key: ${apiKey.key}`);
      console.log('');
      info('Add these to your .env file:');
      console.log('');
      console.log(`PICOBASE_URL=${instance.url}`);
      console.log(`PICOBASE_API_KEY=${apiKey.key}`);
      console.log('');

      // Create .env file if template is specified
      if (options?.template) {
        await createTemplate(projectName!, instance.url, apiKey.key, options.template);
      } else {
        info('Get started with:');
        console.log('');
        console.log('  npm install @picobase_app/client');
        console.log('');
        console.log(`  import { createClient } from '@picobase_app/client'`);
        console.log(`  const pb = createClient('${instance.url}', '${apiKey.key}')`);
        console.log('');
      }
    } catch (err: any) {
      spin.fail('Failed to create instance');
      if (err.response?.status === 409) {
        error('Subdomain already taken. Please choose a different one.');
      } else {
        error(err.response?.data?.message || err.message || 'An error occurred');
      }
      process.exit(1);
    }
  } catch (err: any) {
    error(err.message || 'An error occurred');
    process.exit(1);
  }
}

async function createTemplate(
  projectName: string,
  url: string,
  apiKey: string,
  template: string
): Promise<void> {
  const spin = spinner(`Creating ${template} template...`);

  try {
    const projectDir = path.join(process.cwd(), projectName);

    if (fs.existsSync(projectDir)) {
      spin.fail(`Directory ${projectName} already exists`);
      return;
    }

    fs.mkdirSync(projectDir, { recursive: true });

    // Create .env file
    const envContent = `PICOBASE_URL=${url}\nPICOBASE_API_KEY=${apiKey}\n`;
    fs.writeFileSync(path.join(projectDir, '.env.local'), envContent);

    // Create basic template based on framework
    switch (template) {
      case 'next':
        await createNextTemplate(projectDir, url, apiKey);
        break;
      case 'react':
        await createReactTemplate(projectDir, url, apiKey);
        break;
      case 'vue':
        await createVueTemplate(projectDir, url, apiKey);
        break;
      case 'svelte':
        await createSvelteTemplate(projectDir, url, apiKey);
        break;
      default:
        spin.warn(`Template '${template}' not supported yet`);
        return;
    }

    spin.succeed(`Created ${template} project in ${projectName}/`);
    console.log('');
    info('Next steps:');
    console.log('');
    console.log(`  cd ${projectName}`);
    console.log('  npm install');
    console.log('  npm run dev');
    console.log('');
  } catch (err: any) {
    spin.fail('Failed to create template');
    error(err.message);
  }
}

async function createNextTemplate(projectDir: string, url: string, apiKey: string): Promise<void> {
  // Create package.json
  const packageJson = {
    name: path.basename(projectDir),
    version: '0.1.0',
    private: true,
    scripts: {
      dev: 'next dev',
      build: 'next build',
      start: 'next start',
    },
    dependencies: {
      '@picobase_app/client': '^0.1.0',
      '@picobase_app/react': '^0.1.0',
      next: '^14.0.0',
      react: '^18.2.0',
      'react-dom': '^18.2.0',
    },
    devDependencies: {
      '@types/node': '^20.0.0',
      '@types/react': '^18.2.0',
      typescript: '^5.0.0',
    },
  };

  fs.writeFileSync(
    path.join(projectDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );

  // Create src/app directory
  fs.mkdirSync(path.join(projectDir, 'src', 'app'), { recursive: true });

  // Create layout.tsx
  const layoutContent = `import type { Metadata } from 'next'
import { PicoBaseProvider } from '@picobase_app/react'

export const metadata: Metadata = {
  title: '${path.basename(projectDir)}',
  description: 'Built with PicoBase',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <PicoBaseProvider
          url={process.env.PICOBASE_URL!}
          apiKey={process.env.PICOBASE_API_KEY!}
        >
          {children}
        </PicoBaseProvider>
      </body>
    </html>
  )
}
`;

  fs.writeFileSync(path.join(projectDir, 'src', 'app', 'layout.tsx'), layoutContent);

  // Create page.tsx
  const pageContent = `'use client'
import { useAuth } from '@picobase_app/react'

export default function Home() {
  const { user, loading, signIn, signOut } = useAuth()

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <main style={{ padding: '2rem' }}>
      <h1>Welcome to PicoBase</h1>
      {user ? (
        <div>
          <p>Logged in as: {user.email}</p>
          <button onClick={() => signOut()}>Sign Out</button>
        </div>
      ) : (
        <div>
          <p>Not logged in</p>
          <button onClick={() => signIn('test@example.com', 'password')}>
            Sign In
          </button>
        </div>
      )}
    </main>
  )
}
`;

  fs.writeFileSync(path.join(projectDir, 'src', 'app', 'page.tsx'), pageContent);

  // Create tsconfig.json
  const tsconfig = {
    compilerOptions: {
      target: 'ES2017',
      lib: ['dom', 'dom.iterable', 'esnext'],
      allowJs: true,
      skipLibCheck: true,
      strict: true,
      forceConsistentCasingInFileNames: true,
      noEmit: true,
      esModuleInterop: true,
      module: 'esnext',
      moduleResolution: 'bundler',
      resolveJsonModule: true,
      isolatedModules: true,
      jsx: 'preserve',
      incremental: true,
      plugins: [{ name: 'next' }],
      paths: { '@/*': ['./src/*'] },
    },
    include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
    exclude: ['node_modules'],
  };

  fs.writeFileSync(
    path.join(projectDir, 'tsconfig.json'),
    JSON.stringify(tsconfig, null, 2)
  );

  // Create next.config.js
  const nextConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {}

module.exports = nextConfig
`;

  fs.writeFileSync(path.join(projectDir, 'next.config.js'), nextConfig);
}

async function createReactTemplate(projectDir: string, url: string, apiKey: string): Promise<void> {
  // Placeholder - would use create-react-app or vite
  warning('React template coming soon. Use: npx create-react-app ' + path.basename(projectDir));
}

async function createVueTemplate(projectDir: string, url: string, apiKey: string): Promise<void> {
  // Placeholder - would use create-vue
  warning('Vue template coming soon. Use: npm create vue@latest ' + path.basename(projectDir));
}

async function createSvelteTemplate(projectDir: string, url: string, apiKey: string): Promise<void> {
  // Placeholder - would use create-svelte
  warning('Svelte template coming soon. Use: npm create svelte@latest ' + path.basename(projectDir));
}
