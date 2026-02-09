/**
 * PocketBase authentication utilities
 * Handles admin authentication for proxied PocketBase instances
 */

import { wakeInstance } from './instance-wake'

const RAILWAY_API_URL = process.env.RAILWAY_API_URL
const RAILWAY_API_KEY = process.env.RAILWAY_API_KEY

function normalizeUrl(url: string): string {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`
  }
  return url
}

const NORMALIZED_RAILWAY_API_URL = RAILWAY_API_URL ? normalizeUrl(RAILWAY_API_URL) : ''

/** Max attempts when auto-waking a paused instance */
const WAKE_MAX_ATTEMPTS = 3
/** Delay between wake retries (multiplied by attempt number) */
const WAKE_RETRY_DELAY_MS = 5_000

interface PocketBaseAuthResponse {
  token: string
  admin: {
    id: string
    email: string
  }
}

/**
 * Authenticate with a PocketBase instance and get an admin token.
 *
 * If Railway has paused the PocketBase process, this will automatically
 * attempt to wake it and retry the authentication.
 *
 * @param instanceId - The instance ID
 * @param email - Admin email
 * @param password - Admin password
 * @returns Admin authentication token
 */
export async function authenticateWithPocketBase(
  instanceId: string,
  email: string,
  password: string
): Promise<string> {
  if (!NORMALIZED_RAILWAY_API_URL || !RAILWAY_API_KEY) {
    throw new Error('Railway API not configured')
  }

  const authUrl = `${NORMALIZED_RAILWAY_API_URL}/instances/${instanceId}/proxy/api/admins/auth-with-password`

  for (let attempt = 0; attempt < WAKE_MAX_ATTEMPTS; attempt++) {
    const response = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'X-API-Key': RAILWAY_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        identity: email,
        password: password,
      }),
    })

    if (response.ok) {
      const data: PocketBaseAuthResponse = await response.json()
      return data.token
    }

    const errorText = await response.text()

    // Detect "Instance not running" — Railway has paused the PocketBase process
    if (errorText.includes('Instance not running') && attempt < WAKE_MAX_ATTEMPTS - 1) {
      console.log(
        `[PBAuth] Instance ${instanceId} not running, attempting wake (attempt ${attempt + 1}/${WAKE_MAX_ATTEMPTS})...`
      )
      await wakeInstance(instanceId)
      // Give Railway time to start the process — increases with each attempt
      await new Promise(resolve => setTimeout(resolve, WAKE_RETRY_DELAY_MS * (attempt + 1)))
      continue
    }

    // Non-recoverable error or last attempt — throw
    console.error(`PocketBase auth failed: ${response.status} ${errorText}`)
    throw new Error(`Failed to authenticate with PocketBase: ${errorText}`)
  }

  // Should not be reachable, but satisfy TypeScript
  throw new Error('Failed to authenticate with PocketBase after retries')
}

/**
 * Make an authenticated request to a PocketBase instance
 * @param instanceId - The instance ID
 * @param adminEmail - Admin email
 * @param adminPassword - Admin password
 * @param path - The API path (e.g., 'api/collections')
 * @param options - Fetch options
 * @returns Response from PocketBase
 */
export async function authenticatedPocketBaseRequest(
  instanceId: string,
  adminEmail: string,
  adminPassword: string,
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  if (!NORMALIZED_RAILWAY_API_URL || !RAILWAY_API_KEY) {
    throw new Error('Railway API not configured')
  }

  // Get admin token
  const adminToken = await authenticateWithPocketBase(
    instanceId,
    adminEmail,
    adminPassword
  )

  // Make request with admin token
  const url = `${NORMALIZED_RAILWAY_API_URL}/instances/${instanceId}/proxy/${path}`

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'X-API-Key': RAILWAY_API_KEY,
      'Authorization': adminToken,
      'Content-Type': 'application/json',
    },
  })

  return response
}
