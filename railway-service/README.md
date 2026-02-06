# PicoBase Railway Service

Node.js service that manages PocketBase instances on Railway.

## Features

- ✅ Spawn and manage multiple PocketBase instances
- ✅ API authentication with shared secret
- ✅ Health monitoring
- ✅ Process lifecycle management
- ✅ Automatic cleanup on shutdown

## API Endpoints

All endpoints require `X-API-Key` header for authentication.

### Health Check
```
GET /health
```

### List Instances
```
GET /instances
X-API-Key: your-secret-key
```

### Get Instance Status
```
GET /instances/:id/status
X-API-Key: your-secret-key
```

### Start Instance
```
POST /instances/:id/start
X-API-Key: your-secret-key
Content-Type: application/json

{
  "port": 8090
}
```

### Stop Instance
```
POST /instances/:id/stop
X-API-Key: your-secret-key
```

### Delete Instance
```
DELETE /instances/:id
X-API-Key: your-secret-key
```

## Deployment

### Deploy to Railway

1. **Create new project on Railway**
   ```bash
   railway login
   railway init
   ```

2. **Set environment variables**
   ```bash
   railway variables set API_SECRET_KEY=your-random-secret-key
   railway variables set R2_ACCOUNT_ID=your-account-id
   railway variables set R2_ACCESS_KEY_ID=your-access-key
   railway variables set R2_SECRET_ACCESS_KEY=your-secret-key
   railway variables set R2_BUCKET_NAME=picobase-instances
   ```

3. **Deploy**
   ```bash
   railway up
   ```

4. **Get your Railway URL**
   ```bash
   railway domain
   ```

### Local Development

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Create `.env` file**
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

3. **Run locally**
   ```bash
   npm run dev
   ```

## Environment Variables

- `PORT` - Server port (default: 3000)
- `API_SECRET_KEY` - Shared secret for API authentication
- `R2_ACCOUNT_ID` - Cloudflare R2 account ID
- `R2_ACCESS_KEY_ID` - R2 access key
- `R2_SECRET_ACCESS_KEY` - R2 secret key
- `R2_BUCKET_NAME` - R2 bucket name for backups

## Architecture

```
┌─────────────────────┐
│  Railway Service    │
│  (This Service)     │
│                     │
│  ┌───────────────┐  │
│  │ Express API   │  │
│  └───────┬───────┘  │
│          │          │
│  ┌───────▼───────┐  │
│  │  Instance 1   │  │
│  │  PocketBase   │  │
│  │  Port 8090    │  │
│  └───────────────┘  │
│                     │
│  ┌───────────────┐  │
│  │  Instance 2   │  │
│  │  PocketBase   │  │
│  │  Port 8091    │  │
│  └───────────────┘  │
└─────────────────────┘
```
