import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const RAILWAY_API_URL = process.env.RAILWAY_API_URL;
const RAILWAY_API_KEY = process.env.RAILWAY_API_KEY;

if (!RAILWAY_API_URL || !RAILWAY_API_KEY) {
    console.error('RAILWAY_API_URL or RAILWAY_API_KEY missing');
    process.exit(1);
}

const db = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function main() {
    const instanceId = 'Lo44rVOcZlYB62Zy7UxLd'; // From user request
    console.log(`Debugging Start for Instance: ${instanceId}`);

    try {
        // 1. Check DB Status
        console.log('\n[DB Status]');
        const result = await db.execute({
            sql: 'SELECT * FROM instances WHERE id = ?',
            args: [instanceId],
        });

        if (result.rows.length === 0) {
            console.error('Instance not found in DB');
        } else {
            console.log(result.rows[0]);
        }

        // 2. Check Railway Service Status
        console.log('\n[Railway Service Status]');
        const statusUrl = `${RAILWAY_API_URL}/instances/${instanceId}/status?key=${RAILWAY_API_KEY}`;
        try {
            const statusRes = await fetch(statusUrl, {
                headers: { 'X-API-Key': RAILWAY_API_KEY! }
            });
            console.log(`Status Code: ${statusRes.status}`);
            console.log('Body:', await statusRes.text());
        } catch (e) {
            console.error('Status Fetch Error:', e);
        }

        // 3. Attempt Start (Dry Run / Simulation)
        console.log('\n[Attempting Start via Railway Service]');
        const startUrl = `${RAILWAY_API_URL}/instances/${instanceId}/start`;
        try {
            const startRes = await fetch(startUrl, {
                method: 'POST',
                headers: {
                    'X-API-Key': RAILWAY_API_KEY!,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ port: 8090 }) // Trying default port
            });
            console.log(`Start Code: ${startRes.status}`);
            console.log('Start Body:', await startRes.text());
        } catch (e) {
            console.error('Start Fetch Error:', e);
        }

    } catch (e) {
        console.error('Error:', e);
    }
}

main();
