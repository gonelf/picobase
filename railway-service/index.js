const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const API_SECRET = process.env.API_SECRET_KEY;
const INSTANCES_DIR = '/app/instances';

// Store running instances
const runningInstances = new Map();

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Authentication middleware
function authenticateRequest(req, res, next) {
    // Check for API key in headers, query, or cookies
    const apiKey = req.headers['x-api-key'] || req.query.key || req.cookies['railway-api-key'];

    if (!apiKey || apiKey !== API_SECRET) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // If key came from query, set a cookie for future requests (like assets)
    if (req.query.key === API_SECRET) {
        // Set cookie valid for session or short duration
        res.cookie('railway-api-key', API_SECRET, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        });
    }

    next();
}

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        uptime: process.uptime(),
        instances: runningInstances.size
    });
});

// Get instance status
app.get('/instances/:id/status', authenticateRequest, async (req, res) => {
    const { id } = req.params;

    const instance = runningInstances.get(id);

    if (!instance) {
        return res.json({
            status: 'stopped',
            instanceId: id
        });
    }

    res.json({
        status: 'running',
        instanceId: id,
        port: instance.port,
        pid: instance.process.pid,
        uptime: Date.now() - instance.startTime
    });
});

// Helper function to create PocketBase admin
async function createPocketBaseAdmin(port, email, password) {
    try {
        const response = await fetch(`http://127.0.0.1:${port}/api/admins`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,
                password,
                passwordConfirm: password,
            }),
        });

        if (response.ok) {
            console.log(`Successfully created admin user: ${email}`);
            return true;
        } else if (response.status === 400) {
            console.log(`Admin user already exists for port ${port}`);
            return true;
        } else {
            const errorText = await response.text();
            console.error(`Failed to create admin user: ${response.status} ${errorText}`);
            return false;
        }
    } catch (error) {
        console.error('Error creating PocketBase admin:', error);
        return false;
    }
}

// Start instance
app.post('/instances/:id/start', authenticateRequest, async (req, res) => {
    const { id } = req.params;
    const { port = 8090, adminEmail, adminPassword } = req.body;

    try {
        // Check if already running
        if (runningInstances.has(id)) {
            return res.status(400).json({ error: 'Instance already running' });
        }

        // Create instance directory
        const instanceDir = path.join(INSTANCES_DIR, id);
        await fs.mkdir(instanceDir, { recursive: true });

        // Check if this is first run
        const dbPath = path.join(instanceDir, 'pb_data', 'data.db');
        const isFirstRun = !await fs.access(dbPath).then(() => true).catch(() => false);

        // Start PocketBase process
        const pbProcess = spawn('/usr/local/bin/pocketbase', [
            'serve',
            '--http', `0.0.0.0:${port}`,
            '--dir', instanceDir
        ]);

        // Store instance info
        runningInstances.set(id, {
            process: pbProcess,
            port,
            startTime: Date.now(),
            instanceDir
        });

        // Handle process events
        pbProcess.stdout.on('data', (data) => {
            console.log(`[${id}] ${data}`);
        });

        pbProcess.stderr.on('data', (data) => {
            console.error(`[${id}] ERROR: ${data}`);
        });

        pbProcess.on('exit', (code) => {
            console.log(`[${id}] Process exited with code ${code}`);
            runningInstances.delete(id);
        });

        // Wait for PocketBase to start, then create admin if needed
        if (isFirstRun && adminEmail && adminPassword) {
            setTimeout(async () => {
                console.log(`Creating admin account for instance ${id}...`);
                await createPocketBaseAdmin(port, adminEmail, adminPassword);
            }, 2000);
        }

        res.json({
            success: true,
            instanceId: id,
            port,
            pid: pbProcess.pid
        });

    } catch (error) {
        console.error(`Error starting instance ${id}:`, error);
        res.status(500).json({ error: error.message });
    }
});

// Proxy endpoint - forwards requests to PocketBase instance
app.all('/instances/:id/proxy/*', authenticateRequest, async (req, res) => {
    const { id } = req.params;
    const pathToProxy = req.params[0] || '/';

    const instance = runningInstances.get(id);

    if (!instance) {
        return res.status(404).json({ error: 'Instance not running' });
    }

    try {
        // Forward request to PocketBase instance
        const pbUrl = `http://127.0.0.1:${instance.port}/${pathToProxy}`;
        console.log(`[Proxy] Proxying ${req.method} ${req.url} -> ${pbUrl}`);

        // Create proxy request
        const proxyReq = await fetch(pbUrl, {
            method: req.method,
            headers: {
                ...req.headers,
                host: `127.0.0.1:${instance.port}`,
            },
            body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
        });

        // Forward response
        const body = await proxyReq.arrayBuffer();

        res.status(proxyReq.status);

        // Forward headers, but filter out those that shouldn't be proxied
        // specifically content-encoding, because fetch() already decompresses the body
        // but if we forward content-encoding: gzip, the client will try to decompress it again
        const ignoredHeaders = ['content-encoding', 'content-length', 'transfer-encoding'];

        proxyReq.headers.forEach((value, key) => {
            if (!ignoredHeaders.includes(key.toLowerCase())) {
                res.setHeader(key, value);
            }
        });

        res.send(Buffer.from(body));

    } catch (error) {
        console.error(`Error proxying to instance ${id}:`, error);
        res.status(500).json({ error: 'Proxy error' });
    }
});


// Stop instance
app.post('/instances/:id/stop', authenticateRequest, async (req, res) => {
    const { id } = req.params;

    const instance = runningInstances.get(id);

    if (!instance) {
        return res.status(404).json({ error: 'Instance not running' });
    }

    try {
        // Kill the process
        instance.process.kill('SIGTERM');

        // Wait a bit for graceful shutdown
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Force kill if still running
        if (!instance.process.killed) {
            instance.process.kill('SIGKILL');
        }

        runningInstances.delete(id);

        res.json({
            success: true,
            instanceId: id
        });

    } catch (error) {
        console.error(`Error stopping instance ${id}:`, error);
        res.status(500).json({ error: error.message });
    }
});

// Delete instance
app.delete('/instances/:id', authenticateRequest, async (req, res) => {
    const { id } = req.params;

    try {
        // Stop if running
        const instance = runningInstances.get(id);
        if (instance) {
            instance.process.kill('SIGKILL');
            runningInstances.delete(id);
        }

        // Delete instance directory
        const instanceDir = path.join(INSTANCES_DIR, id);
        await fs.rm(instanceDir, { recursive: true, force: true });

        res.json({
            success: true,
            instanceId: id
        });

    } catch (error) {
        console.error(`Error deleting instance ${id}:`, error);
        res.status(500).json({ error: error.message });
    }
});

// List all instances
app.get('/instances', authenticateRequest, (req, res) => {
    const instances = Array.from(runningInstances.entries()).map(([id, instance]) => ({
        instanceId: id,
        port: instance.port,
        pid: instance.process.pid,
        uptime: Date.now() - instance.startTime,
        status: 'running'
    }));

    res.json({ instances });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 PicoBase Railway Service running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

// Cleanup on exit
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');

    // Stop all instances
    for (const [id, instance] of runningInstances.entries()) {
        console.log(`Stopping instance ${id}...`);
        instance.process.kill('SIGTERM');
    }

    process.exit(0);
});
