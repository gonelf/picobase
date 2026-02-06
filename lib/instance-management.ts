import { db } from '@/lib/db'

/**
 * Ensures an instance has a valid, non-conflicting port assigned.
 * If the current port is in use by another running instance, assigns a new one.
 */
export async function ensureInstancePort(instanceId: string, currentPort?: number): Promise<number> {
    // 1. Get all ports currently used by running instances
    const usedPortsResult = await db.execute('SELECT port FROM instances WHERE status = "running" AND port IS NOT NULL')
    const usedPorts = new Set(usedPortsResult.rows.map(row => row.port as number))

    let port = currentPort

    // If port is undefined, null, or already in use by another running instance, assign a new one
    if (!port || usedPorts.has(port)) {
        // Find first available port starting from 8090
        let candidate = 8090
        while (usedPorts.has(candidate)) {
            candidate++
        }
        port = candidate

        // Update the instance with the new port immediately to reserve it
        // We update status to 'starting' or keep it as is, but here we just want to save the port
        await db.execute({
            sql: 'UPDATE instances SET port = ? WHERE id = ?',
            args: [port, instanceId]
        })
    }

    return port
}
