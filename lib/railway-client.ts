/**
 * Railway API Client
 * Communicates with the Railway service to manage PocketBase instances
 */

// Normalize the Railway API URL to ensure it has a protocol
function normalizeUrl(url: string): string {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return `https://${url}`;
    }
    return url;
}

const RAILWAY_API_URL = process.env.RAILWAY_API_URL;
const RAILWAY_API_KEY = process.env.RAILWAY_API_KEY;

if (!RAILWAY_API_URL) {
    throw new Error('RAILWAY_API_URL environment variable is not set');
}

if (!RAILWAY_API_KEY) {
    throw new Error('RAILWAY_API_KEY environment variable is not set');
}

// Normalize the Railway API URL
const NORMALIZED_RAILWAY_API_URL = normalizeUrl(RAILWAY_API_URL);

interface RailwayResponse {
    success?: boolean;
    error?: string;
    [key: string]: any;
}

async function railwayRequest(
    endpoint: string,
    options: RequestInit = {}
): Promise<RailwayResponse> {
    const url = `${NORMALIZED_RAILWAY_API_URL}${endpoint}`;

    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'X-API-Key': RAILWAY_API_KEY!,
            ...options.headers,
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || `Railway API error: ${response.statusText}`);
    }

    return response.json();
}

export async function startRailwayInstance(instanceId: string, port: number = 8090) {
    return railwayRequest(`/instances/${instanceId}/start`, {
        method: 'POST',
        body: JSON.stringify({ port }),
    });
}

export async function stopRailwayInstance(instanceId: string) {
    return railwayRequest(`/instances/${instanceId}/stop`, {
        method: 'POST',
    });
}

export async function deleteRailwayInstance(instanceId: string) {
    return railwayRequest(`/instances/${instanceId}`, {
        method: 'DELETE',
    });
}

export async function getRailwayInstanceStatus(instanceId: string) {
    return railwayRequest(`/instances/${instanceId}/status`);
}

export async function listRailwayInstances() {
    return railwayRequest('/instances');
}

export async function checkRailwayHealth() {
    return railwayRequest('/health');
}
