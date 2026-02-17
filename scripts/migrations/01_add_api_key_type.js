const { createClient } = require('@libsql/client')
require('dotenv').config({ path: '.env.local' })

async function migrate() {
    console.log('Starting migration: 01_add_api_key_type...')

    if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
        console.error('Error: TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set')
        process.exit(1)
    }

    const db = createClient({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
    })

    try {
        // Check if column exists first to avoid error
        // SQLite doesn't support IF NOT EXISTS for column addition in standard SQL, 
        // but we can try adding it and catch the error if it exists, or check via pragma/table_info
        // For simplicity with libSQL, let's try to add it.

        try {
            await db.execute(`
        ALTER TABLE api_keys ADD COLUMN type TEXT DEFAULT 'standard'
      `)
            console.log('✓ Added type column to api_keys table')
        } catch (e) {
            if (e.message.includes('duplicate column name')) {
                console.log('ℹ️ Column type already exists in api_keys')
            } else {
                throw e
            }
        }

        console.log('\n✅ Migration completed successfully!')
    } catch (error) {
        console.error('❌ Migration failed:', error)
        process.exit(1)
    }
}

migrate()
