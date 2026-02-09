/**
 * Environment variable validation for the PicoBase platform.
 *
 * Validates all required env vars at startup and provides clear,
 * actionable error messages when something is missing or malformed.
 *
 * Import this module early in your app (e.g., layout.tsx or middleware.ts)
 * to fail fast with helpful messages instead of cryptic runtime errors.
 */

interface EnvVar {
  name: string
  required: boolean
  description: string
  example: string
  /** If set, only required when this condition returns true */
  when?: () => boolean
}

const ENV_VARS: EnvVar[] = [
  // Database
  {
    name: 'TURSO_DATABASE_URL',
    required: true,
    description: 'Turso database URL for platform metadata',
    example: 'libsql://your-database.turso.io',
  },
  {
    name: 'TURSO_AUTH_TOKEN',
    required: true,
    description: 'Turso authentication token',
    example: 'eyJhbGciOi...',
  },

  // Storage
  {
    name: 'R2_ACCOUNT_ID',
    required: true,
    description: 'Cloudflare account ID for R2 storage',
    example: 'abc123def456',
  },
  {
    name: 'R2_ACCESS_KEY_ID',
    required: true,
    description: 'R2 access key ID',
    example: 'your-r2-access-key-id',
  },
  {
    name: 'R2_SECRET_ACCESS_KEY',
    required: true,
    description: 'R2 secret access key',
    example: 'your-r2-secret-access-key',
  },
  {
    name: 'R2_BUCKET_NAME',
    required: true,
    description: 'R2 bucket name for instance backups',
    example: 'picobase-instances',
  },
  {
    name: 'R2_ENDPOINT',
    required: true,
    description: 'R2 S3-compatible endpoint URL',
    example: 'https://your-account-id.r2.cloudflarestorage.com',
  },

  // Auth
  {
    name: 'AUTH_PROVIDER',
    required: true,
    description: 'Authentication provider (supertokens or nextauth)',
    example: 'supertokens',
  },
  {
    name: 'SUPERTOKENS_CONNECTION_URI',
    required: true,
    description: 'SuperTokens managed service connection URI',
    example: 'https://st-dev-your-app-id.aws.supertokens.io',
    when: () => process.env.AUTH_PROVIDER === 'supertokens',
  },
  {
    name: 'SUPERTOKENS_API_KEY',
    required: true,
    description: 'SuperTokens API key',
    example: 'your-supertokens-api-key',
    when: () => process.env.AUTH_PROVIDER === 'supertokens',
  },
  {
    name: 'NEXTAUTH_URL',
    required: true,
    description: 'NextAuth base URL',
    example: 'http://localhost:3000/api/identity',
    when: () => process.env.AUTH_PROVIDER === 'nextauth',
  },
  {
    name: 'NEXTAUTH_SECRET',
    required: true,
    description: 'NextAuth secret for JWT signing (generate with: openssl rand -base64 32)',
    example: 'your-nextauth-secret',
    when: () => process.env.AUTH_PROVIDER === 'nextauth',
  },

  // Platform
  {
    name: 'PLATFORM_DOMAIN',
    required: true,
    description: 'Domain the platform runs on',
    example: 'localhost:3000',
  },
  {
    name: 'INSTANCES_DOMAIN',
    required: true,
    description: 'Domain for instance subdomains (instances accessible at {subdomain}.this-domain)',
    example: 'picobase.com',
  },

  // Railway
  {
    name: 'RAILWAY_API_URL',
    required: false,
    description: 'Railway service URL for production instance hosting',
    example: 'https://your-service.railway.app',
  },
  {
    name: 'RAILWAY_API_KEY',
    required: false,
    description: 'Railway service shared secret',
    example: 'your-shared-secret-key',
  },
]

export interface EnvValidationError {
  name: string
  description: string
  example: string
}

/**
 * Validate all required environment variables and return any errors.
 * Call this at app startup to get clear feedback on what's missing.
 */
export function validateEnv(): EnvValidationError[] {
  const errors: EnvValidationError[] = []

  for (const v of ENV_VARS) {
    if (!v.required) continue
    if (v.when && !v.when()) continue

    const value = process.env[v.name]
    if (!value || value.trim() === '') {
      errors.push({
        name: v.name,
        description: v.description,
        example: v.example,
      })
    }
  }

  return errors
}

/**
 * Validate env vars and print a formatted error summary if anything is missing.
 * Returns true if all required vars are present.
 */
export function checkEnvOrWarn(): boolean {
  const errors = validateEnv()
  if (errors.length === 0) return true

  console.error('\n━━━ PicoBase: Missing environment variables ━━━\n')

  for (const err of errors) {
    console.error(`  ${err.name}`)
    console.error(`    ${err.description}`)
    console.error(`    Example: ${err.example}\n`)
  }

  console.error('Copy .env.example to .env.local and fill in the values:')
  console.error('  cp .env.example .env.local\n')

  return false
}
