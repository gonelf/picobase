import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { createClient } from '../packages/client/src'
import { createApiKey } from '../lib/api-keys'
import { db } from '../lib/db'

// We need to run this in a context where environment variables are loaded 
// and database connection works. This script is intended to be run with `ts-node`
// or similar from the project root.

async function verifyAdminApi() {
    console.log('Starting Admin API verification...')

    // 1. Get the first running instance to test against
    const instanceResult = await db.execute('SELECT id, subdomain FROM instances WHERE status = "running" LIMIT 1')

    if (instanceResult.rows.length === 0) {
        console.error('❌ No running instances found. Please start an instance first.')
        return
    }

    const instance = instanceResult.rows[0]
    const instanceId = instance.id as string
    const subdomain = instance.subdomain as string

    // Use localhost port directly and bypass subdomain routing by hitting proxy endpoint
    const PORT = process.env.PORT || 3007
    const url = `http://localhost:${PORT}/api/proxy`

    console.log(`Testing against instance: ${subdomain} (${instanceId}) via proxy at ${url}`)

    // 2. Create an ADMIN API Key
    console.log('Creating Admin API Key...')
    const keyName = `test_admin_key_${Date.now()}`
    const apiKeyData = await createApiKey(instanceId, keyName, 'admin')
    const apiKey = apiKeyData.key

    console.log('Admin API Key created.')

    // 3. Initialize SDK
    const pb = createClient(url, apiKey)

    // Manually inject the subdomain header which the middleware usually does
    // Manually inject the subdomain header which the middleware usually does
    pb.pb.beforeSend = (url, options) => {
        options.headers = {
            ...options.headers,
            'x-instance-subdomain': subdomain,
            // 'x-picobase-key': apiKey // Do NOT set this here, we use X-PicoBase-Key below
        }

        // We must re-add the API key header since we overwrote the default hook
        // @ts-ignore
        options.headers['X-PicoBase-Key'] = apiKey

        return { url, options }
    }

    // 4. Test: Create Collection
    const collectionName = `test_col_${Date.now()}`
    console.log(`Creating collection: ${collectionName}...`)

    try {
        await pb.admin.createCollection({
            name: collectionName,
            type: 'base',
            schema: [
                { name: 'title', type: 'text', required: true, system: false, id: 'autogen1', presentable: false, unique: false, options: {} }
            ]
        })
        console.log('✓ Collection created successfully')
    } catch (error: any) {
        console.error('❌ Failed to create collection:', error)
        // Clean up key
        await db.execute({ sql: 'DELETE FROM api_keys WHERE id = ?', args: [apiKeyData.id] })
        return
    }

    // 5. Test: List Collections
    console.log('Listing collections...')
    try {
        const collections = await pb.admin.listCollections()
        const found = collections.find(c => c.name === collectionName)
        if (found) {
            console.log('✓ Created collection found in list')
        } else {
            console.error('❌ Created collection NOT found in list')
        }
    } catch (error) {
        console.error('❌ Failed to list collections:', error)
    }

    // 6. Test: Delete Collection
    console.log(`Deleting collection: ${collectionName}...`)
    try {
        const success = await pb.admin.deleteCollection(collectionName)
        if (success) {
            console.log('✓ Collection deleted successfully')
        } else {
            console.error('❌ Failed to delete collection')
        }
    } catch (error) {
        console.error('❌ Error deleting collection:', error)
    }

    // 7. Cleanup API Key
    console.log('Cleaning up API key...')
    await db.execute({ sql: 'DELETE FROM api_keys WHERE id = ?', args: [apiKeyData.id] })

    console.log('Verification complete.')
}

verifyAdminApi().catch(console.error)
