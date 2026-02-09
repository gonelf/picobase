# PicoBase CLI

Command-line interface for managing PicoBase instances.

## Installation

```bash
npm install -g picobase
```

## Quick Start

```bash
# 1. Login to your PicoBase account
picobase login

# 2. Create a new instance
picobase init my-project

# 3. Check instance status
picobase status

# 4. Open dashboard in browser
picobase dashboard

# 5. View logs
picobase logs --tail 50
```

## Commands

### `picobase login`

Authenticate with PicoBase. You'll be prompted for your email and password.

```bash
picobase login
```

The CLI stores your auth token in `~/.picobase/config.json`.

### `picobase init [project-name]`

Create a new PicoBase instance.

```bash
# Basic usage
picobase init my-project

# Create with a framework template
picobase init my-app --template next
picobase init my-app --template react
picobase init my-app --template vue
picobase init my-app --template svelte
```

This command will:
1. Create a new PicoBase instance
2. Generate an API key
3. Save the configuration locally
4. Optionally scaffold a new project with the selected template

**Options:**
- `-t, --template <template>` - Use a framework template (next, react, vue, svelte)

### `picobase status`

Show the current instance status.

```bash
# Show status for current instance
picobase status

# Show status for a specific instance
picobase status --instance <instance-id>
```

**Options:**
- `-i, --instance <id>` - Instance ID (defaults to current instance)

### `picobase dashboard`

Open the instance dashboard in your default browser.

```bash
# Open dashboard for current instance
picobase dashboard

# Open dashboard for a specific instance
picobase dashboard --instance <instance-id>
```

**Options:**
- `-i, --instance <id>` - Instance ID (defaults to current instance)

### `picobase logs`

View instance logs.

```bash
# View last 100 lines
picobase logs

# View last 50 lines
picobase logs --tail 50

# Follow logs in real-time
picobase logs --follow

# View logs for a specific instance
picobase logs --instance <instance-id>
```

**Options:**
- `-i, --instance <id>` - Instance ID (defaults to current instance)
- `-f, --follow` - Follow log output in real-time
- `-n, --tail <lines>` - Number of lines to show (default: 100)

### `picobase typegen`

Generate TypeScript types from your collection schemas.

```bash
# Generate types to default location
picobase typegen

# Generate types to custom location
picobase typegen --output ./types/database.ts

# Generate for a specific instance
picobase typegen --instance <instance-id>
```

**Options:**
- `-o, --output <path>` - Output file path (default: ./src/types/picobase.ts)
- `-i, --instance <id>` - Instance ID (defaults to current instance)

**Example generated types:**

```typescript
export interface PostsRecord extends BaseRecord {
  title: string;
  content: string;
  author: string;
  published: boolean;
}

export type CollectionName = 'posts' | 'users' | 'comments';

export interface CollectionRecords {
  posts: PostsRecord;
  users: UsersRecord;
  comments: CommentsRecord;
}
```

**Typed client helper** — `typegen` also generates a `createTypedClient()` and a pre-configured `pb` instance:

```typescript
// Import the typed client — collection names autocomplete, record fields are typed
import { pb } from './src/types/picobase'

const posts = await pb.collection('posts').getList(1, 20)
//                                ^-- autocomplete!  ^-- PostsRecord[]
posts.items[0].title  // typed!

// Or create your own typed client
import { createTypedClient } from './src/types/picobase'
const pb = createTypedClient('https://myapp.picobase.com', 'pbk_...')
```

### `picobase dev`

Start a local PocketBase instance for development — optionally with your app dev server too.

```bash
# Start PocketBase only (default port 8090)
picobase dev

# Start PocketBase + your app dev server in one command
picobase dev --with-app

# Start PocketBase + a custom app command
picobase dev --run "vite"

# Custom port
picobase dev --port 8080 --with-app
```

**Options:**
- `-p, --port <port>` - Port to run on (default: 8090)
- `-a, --with-app` - Also start your app dev server (`npm run dev`)
- `-r, --run <command>` - Custom command to start your app (e.g., `"vite"`, `"next dev"`)

This command will:
1. Download PocketBase if not already installed (stored in `~/.picobase/dev/`)
2. Start a local PocketBase instance
3. Create a `pb_data` directory in your current working directory
4. Admin UI available at `http://127.0.0.1:8090/_/`
5. With `--with-app` or `--run`: start your app dev server alongside PocketBase, with `PICOBASE_URL`, `NEXT_PUBLIC_PICOBASE_URL`, and `VITE_PICOBASE_URL` automatically injected

Both processes share a single Ctrl+C shutdown.

## Configuration

The CLI stores configuration in `~/.picobase/config.json`:

```json
{
  "authToken": "your-auth-token",
  "currentInstance": "inst_abc123",
  "instances": {
    "inst_abc123": {
      "id": "inst_abc123",
      "name": "my-project",
      "url": "https://my-project.picobase.com",
      "apiKey": "pbk_abc123..."
    }
  }
}
```

## Framework Templates

### Next.js Template

Creates a Next.js 14 app with:
- App Router
- TypeScript
- `@picobase_app/client` and `@picobase_app/react` pre-configured
- Example authentication flow
- Environment variables setup

```bash
picobase init my-app --template next
cd my-app
npm install
npm run dev
```

### React Template

Creates a React + Vite + TypeScript app with PicoBase pre-configured.

```bash
picobase init my-app --template react
cd my-app
npm install
npm run dev
```

Includes:
- Vite with React plugin and TypeScript
- `@picobase_app/client` and `@picobase_app/react` pre-installed
- `src/picobase.ts` — single-file client setup
- `src/App.tsx` — example authentication flow
- `src/vite-env.d.ts` — typed `import.meta.env` for Vite env vars
- `.env` with `VITE_PICOBASE_URL` and `VITE_PICOBASE_API_KEY`

### Vue Template (Coming Soon)

Creates a Vue 3 app with TypeScript and PicoBase.

```bash
picobase init my-app --template vue
```

### Svelte Template (Coming Soon)

Creates a SvelteKit app with TypeScript and PicoBase.

```bash
picobase init my-app --template svelte
```

## Environment Variables

After running `picobase init`, add these to your `.env.local`:

```bash
PICOBASE_URL=https://your-app.picobase.com
PICOBASE_API_KEY=pbk_abc123...
```

## Examples

### Create and deploy a Next.js app

```bash
# 1. Login
picobase login

# 2. Create instance with Next.js template
picobase init my-blog --template next

# 3. Navigate to project
cd my-blog

# 4. Install dependencies
npm install

# 5. Start development server
npm run dev

# 6. In another terminal, view logs
picobase logs --follow
```

### Generate types for existing instance

```bash
# 1. Make sure you're in your project directory
cd my-project

# 2. Generate types
picobase typegen

# 3. Import in your code
import { PostsRecord } from './src/types/picobase'
```

### Local development with PocketBase

```bash
# Option A: Start both PocketBase and your app in one command
picobase dev --with-app
# PocketBase runs on :8090, your app on its default port
# PICOBASE_URL is auto-injected into your app's environment

# Option B: PocketBase only (if you want separate terminals)
picobase dev
# Then in another terminal: npm run dev

# Open http://127.0.0.1:8090/_/ to set up collections in the admin UI
```

## Troubleshooting

### "You must be logged in"

Run `picobase login` to authenticate.

### "No instance found"

Run `picobase init` to create a new instance or specify an instance ID with `--instance`.

### "Failed to download PocketBase"

The `picobase dev` command downloads PocketBase from GitHub. Check your internet connection and firewall settings.

### Types not updating

Run `picobase typegen` again after modifying your collection schemas in the dashboard.

## Support

- Documentation: https://picobase.com/docs
- GitHub: https://github.com/gonelf/picobase
- Issues: https://github.com/gonelf/picobase/issues

## License

MIT
