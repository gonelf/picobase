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
    // Add admin_email and admin_password columns to instances table
    await db.execute(`
      ALTER TABLE instances ADD COLUMN admin_email TEXT
    `)
    console.log('✓ Added admin_email column')

    await db.execute(`
      ALTER TABLE instances ADD COLUMN admin_password TEXT
    `)
    console.log('✓ Added admin_password column')

    console.log('\n✅ Migration completed successfully!')
    console.log('\n⚠️  Note: Existing instances will have NULL admin credentials.')
    console.log('You may need to manually set credentials for existing instances.')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

migrate()
