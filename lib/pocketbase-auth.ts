/**
 * PocketBase authentication utilities
 * Handles admin authentication for proxied PocketBase instances
 */

import { createModuleLogger } from './logger'

const log = createModuleLogger('PocketBaseAuth')

const RAILWAY_API_URL = process.env.RAILWAY_API_URL
const RAILWAY_API_KEY = process.env.RAILWAY_API_KEY

function normalizeUrl(url: string): string {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`
  }
  return url
}

const NORMALIZED_RAILWAY_API_URL = RAILWAY_API_URL ? normalizeUrl(RAILWAY_API_URL) : ''

interface PocketBaseAuthResponse {
  token: string
  admin: {
    id: string
    email: string
  }
}

/**
 * Authenticate with a PocketBase instance and get an admin token
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

  // Authenticate with PocketBase admin API
  const authUrl = `${NORMALIZED_RAILWAY_API_URL}/instances/${instanceId}/proxy/api/admins/auth-with-password`

  const response = await fetch(authUrl, {
    method: 'POST',
    headers: {
      'X-API-Key': RAILWAY_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      identity: email,
      password: password,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    log.error({ instanceId, status: response.status, errorText }, 'PocketBase auth failed')
    throw new Error(`Failed to authenticate with PocketBase: ${errorText}`)
  }

  const data: PocketBaseAuthResponse = await response.json()
  return data.token
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
