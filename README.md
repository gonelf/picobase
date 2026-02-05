# PicoBase - Multi-tenant BaaS Platform

A **Supabase alternative** that provides on-demand PocketBase instances with automatic R2 storage backup and tenant management powered by Turso.

## 🎯 Features

- **Multi-tenant Architecture**: Each user can create and manage multiple PocketBase instances
- **On-demand Instances**: Start/stop PocketBase instances as needed to save resources
- **Persistent Storage**: Automatic database backup to Cloudflare R2
- **API Key Management**: Generate and manage API keys for each instance
- **User Dashboard**: Beautiful UI for managing instances and monitoring status
- **Serverless-ready**: Built with Next.js and designed for Vercel deployment

## 🏗️ Architecture

### Tech Stack

- **Frontend/Backend**: Next.js 14 with TypeScript
- **Authentication**: NextAuth.js v5 (credentials provider)
- **Tenant Database**: Turso (LibSQL) - stores users, instances, API keys
- **Storage**: Cloudflare R2 - persists PocketBase databases
- **BaaS Engine**: PocketBase - individual instances per project
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

### How It Works

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────┐
│   Next.js Dashboard         │
│   (Vercel)                  │
└──────┬──────────────────────┘
       │
       ├──────────────┐
       ▼              ▼
┌─────────────┐  ┌──────────────┐
│   Turso DB  │  │ Cloudflare R2│
│  (Metadata) │  │  (Databases) │
└─────────────┘  └──────────────┘
       │
       ▼
┌─────────────────────────────┐
│  PocketBase Instances       │
│  (On-demand processes)      │
│  - Instance 1: Port 8090    │
│  - Instance 2: Port 8091    │
│  - Instance N: Port 809N    │
└─────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn
- PocketBase binary installed ([Download](https://pocketbase.io/docs/))
- Turso account ([Sign up](https://turso.tech/))
- Cloudflare account with R2 enabled

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd picobase
npm install
```

### 2. Set Up Turso Database

```bash
# Install Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Create database
turso db create picobase

# Get database URL
turso db show picobase --url

# Create auth token
turso db tokens create picobase
```

### 3. Set Up Cloudflare R2

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to R2 Object Storage
3. Create a bucket named `picobase-instances`
4. Create R2 API tokens with read/write permissions
5. Note your Account ID, Access Key ID, and Secret Access Key

### 4. Configure Environment Variables

Create `.env.local` file:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```env
# Turso Database
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your-turso-auth-token

# Cloudflare R2
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_BUCKET_NAME=picobase-instances

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here

# PocketBase Configuration
POCKETBASE_BINARY_PATH=/usr/local/bin/pocketbase
INSTANCES_BASE_PORT=8090
```

Generate `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

### 5. Run Database Migration

```bash
npm run db:migrate
```

### 6. Install PocketBase

```bash
# macOS/Linux
wget https://github.com/pocketbase/pocketbase/releases/download/v0.22.0/pocketbase_0.22.0_linux_amd64.zip
unzip pocketbase_0.22.0_linux_amd64.zip
sudo mv pocketbase /usr/local/bin/

# Or set custom path in .env.local
# POCKETBASE_BINARY_PATH=/path/to/pocketbase
```

### 7. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 📖 Usage

### Creating an Account

1. Go to `/auth/signup`
2. Enter your name, email, and password
3. Sign in at `/auth/signin`

### Creating a PocketBase Instance

1. Click "Create Instance" in the dashboard
2. Enter a name and subdomain
3. Your instance will be created (status: `stopped`)
4. Click "Start" to launch the instance
5. Your PocketBase API will be available at `http://localhost:PORT`

### Managing API Keys

1. Go to instance details page
2. Click "Create API Key"
3. Copy the key (shown only once!)
4. Use the key to authenticate requests to your PocketBase instance

### Instance Lifecycle

- **Stopped**: Instance is not running, database is in R2
- **Starting**: Instance is being launched, database downloading from R2
- **Running**: Instance is active and accepting requests
- **Stopping**: Instance is shutting down, database uploading to R2

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/signin` - Sign in (NextAuth)

### Instances
- `POST /api/instances` - Create new instance
- `POST /api/instances/:id/start` - Start instance
- `POST /api/instances/:id/stop` - Stop instance
- `DELETE /api/instances/:id` - Delete instance

### API Keys
- `POST /api/instances/:id/keys` - Create API key
- `DELETE /api/instances/:id/keys/:keyId` - Delete API key

## 🚀 Deployment to Vercel

### 1. Push to GitHub

```bash
git add .
git commit -m "Initial PicoBase setup"
git push origin main
```

### 2. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Add environment variables from `.env.local`
4. Deploy!

### 3. Important Notes for Production

⚠️ **PocketBase Binary**: The current architecture runs PocketBase as a process, which works locally but has limitations on Vercel:

- Vercel serverless functions have a 10-second timeout
- File system is read-only except for `/tmp`
- Processes don't persist between requests

**Production Recommendations**:

1. **Self-hosted option**: Deploy the Next.js app on a VPS (DigitalOcean, Hetzner, AWS EC2) where you can run PocketBase processes
2. **Containerized option**: Use Docker containers for each instance with Kubernetes orchestration
3. **Hybrid option**:
   - Host Next.js dashboard on Vercel
   - Run PocketBase instances on a separate VPS
   - Use API gateway to route requests

## 📁 Project Structure

```
picobase/
├── app/
│   ├── api/
│   │   ├── auth/          # Authentication endpoints
│   │   └── instances/     # Instance management APIs
│   ├── auth/              # Sign in/up pages
│   ├── dashboard/         # Dashboard pages
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/            # React components
│   ├── ApiKeysList.tsx
│   ├── InstanceActions.tsx
│   └── InstanceCard.tsx
├── lib/
│   ├── api-keys.ts       # API key utilities
│   ├── auth.ts           # Auth utilities
│   ├── db.ts             # Turso client
│   ├── pocketbase.ts     # Instance orchestration
│   └── r2.ts             # R2 storage client
├── scripts/
│   └── migrate.js        # Database migration
├── auth.ts               # NextAuth config
├── middleware.ts         # Route protection
├── .env.example
├── package.json
└── README.md
```

## 🔒 Security Considerations

- API keys are hashed with bcrypt before storage
- User passwords are hashed with bcrypt (10 rounds)
- NextAuth handles session management with JWT
- Middleware protects dashboard routes
- Instance ownership is verified on all operations
- Environment variables for sensitive credentials

## 🛠️ Development

### Adding New Features

1. **Database changes**: Update `scripts/migrate.js` and `lib/db.ts`
2. **API endpoints**: Add routes in `app/api/`
3. **UI components**: Create in `components/`
4. **Pages**: Add to `app/dashboard/`

### Testing Locally

```bash
# Start dev server
npm run dev

# Create test user
# Visit http://localhost:3000/auth/signup

# Create instance and test start/stop
```

## 📝 Roadmap

- [ ] Custom domains for instances
- [ ] Usage metrics and billing
- [ ] Instance templates
- [ ] Backup/restore functionality
- [ ] Team collaboration
- [ ] Email notifications
- [ ] WebSocket support for real-time updates
- [ ] Docker-based orchestration
- [ ] Auto-sleep after inactivity
- [ ] Multi-region support

## 🤝 Contributing

Contributions are welcome! Please open an issue or PR.

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🙏 Acknowledgments

- [PocketBase](https://pocketbase.io/) - Excellent BaaS solution
- [Turso](https://turso.tech/) - Distributed SQLite
- [Cloudflare R2](https://www.cloudflare.com/products/r2/) - S3-compatible storage
- [Next.js](https://nextjs.org/) - React framework
- [NextAuth.js](https://next-auth.js.org/) - Authentication

---

Built with ❤️ by the PicoBase community
