const { createClient } = require('@libsql/client')
require('dotenv').config({ path: '.env.local' })

async function migrate() {
  console.log('Starting database migration...')

  if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
    console.error('Error: TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set')
    process.exit(1)
  }

  const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  })

  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `)
    console.log('✓ Created users table')

    await db.execute(`
      CREATE TABLE IF NOT EXISTS instances (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        subdomain TEXT UNIQUE NOT NULL,
        status TEXT NOT NULL DEFAULT 'stopped',
        port INTEGER,
        r2_key TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        last_started_at TEXT,
        last_stopped_at TEXT,
        last_activity_at TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `)
    console.log('✓ Created instances table')

    // Add last_activity_at column if missing (for existing databases)
    try {
      await db.execute('ALTER TABLE instances ADD COLUMN last_activity_at TEXT')
      console.log('✓ Added last_activity_at column to instances')
    } catch (e) {
      // Column already exists
    }

    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_instances_user_id ON instances(user_id)
    `)
    console.log('✓ Created index on instances.user_id')

    await db.execute(`
      CREATE TABLE IF NOT EXISTS api_keys (
        id TEXT PRIMARY KEY,
        instance_id TEXT NOT NULL,
        key_hash TEXT NOT NULL,
        key_prefix TEXT NOT NULL,
        name TEXT NOT NULL,
        last_used_at TEXT,
        created_at TEXT NOT NULL,
        expires_at TEXT,
        FOREIGN KEY (instance_id) REFERENCES instances(id) ON DELETE CASCADE
      )
    `)
    console.log('✓ Created api_keys table')

    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_api_keys_instance_id ON api_keys(instance_id)
    `)
    console.log('✓ Created index on api_keys.instance_id')

    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys(key_prefix)
    `)
    console.log('✓ Created index on api_keys.key_prefix')

    await db.execute(`
      CREATE TABLE IF NOT EXISTS usage_logs (
        id TEXT PRIMARY KEY,
        instance_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        metadata TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (instance_id) REFERENCES instances(id) ON DELETE CASCADE
      )
    `)
    console.log('✓ Created usage_logs table')

    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_usage_logs_instance_id ON usage_logs(instance_id)
    `)
    console.log('✓ Created index on usage_logs.instance_id')

    await db.execute(`
      CREATE TABLE IF NOT EXISTS waitlist_entries (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        referral_code TEXT UNIQUE NOT NULL,
        referred_by TEXT,
        position INTEGER NOT NULL,
        referral_count INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      )
    `)
    console.log('✓ Created waitlist_entries table')

    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_waitlist_referral_code ON waitlist_entries(referral_code)
    `)
    console.log('✓ Created index on waitlist_entries.referral_code')

    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_waitlist_position ON waitlist_entries(position)
    `)
    console.log('✓ Created index on waitlist_entries.position')

    console.log('\n✅ Migration completed successfully!')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

migrate()
