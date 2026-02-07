const { createClient } = require('@libsql/client')
require('dotenv').config({ path: '.env.local' })

async function migrate() {
  console.log('Adding admin credential fields to instances table...')

  if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
    console.error('Error: TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set')
    process.exit(1)
  }

  const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  })

  try {
    // Check if columns already exist by querying table schema
    const schemaResult = await db.execute(`
      SELECT sql FROM sqlite_master WHERE type='table' AND name='instances'
    `)

    if (schemaResult.rows.length === 0) {
      console.error('Error: instances table does not exist. Run db:migrate first.')
      process.exit(1)
    }

    const tableSchema = schemaResult.rows[0].sql
    const hasAdminEmail = tableSchema.includes('admin_email')
    const hasAdminPassword = tableSchema.includes('admin_password')

    // Add admin_email column if it doesn't exist
    if (!hasAdminEmail) {
      await db.execute(`
        ALTER TABLE instances ADD COLUMN admin_email TEXT
      `)
      console.log('✓ Added admin_email column')
    } else {
      console.log('✓ admin_email column already exists (skipped)')
    }

    // Add admin_password column if it doesn't exist
    if (!hasAdminPassword) {
      await db.execute(`
        ALTER TABLE instances ADD COLUMN admin_password TEXT
      `)
      console.log('✓ Added admin_password column')
    } else {
      console.log('✓ admin_password column already exists (skipped)')
    }

    console.log('\n✅ Migration completed successfully!')

    if (hasAdminEmail && hasAdminPassword) {
      console.log('\n✓ All columns already existed - database is up to date!')
    } else {
      console.log('\n⚠️  Note: Existing instances will have NULL admin credentials.')
      console.log('New instances will have credentials auto-generated.')
    }
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

migrate()
