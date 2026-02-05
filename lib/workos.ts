import { WorkOS } from '@workos-inc/node'

export const workos = new WorkOS(process.env.WORKOS_API_KEY)

export const clientId = process.env.WORKOS_CLIENT_ID!

// Get the base URL for callbacks
export function getBaseUrl() {
  if (process.env.WORKOS_REDIRECT_URI) {
    return process.env.WORKOS_REDIRECT_URI.replace('/callback', '')
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  return process.env.NEXTAUTH_URL || 'http://localhost:3000'
}

export function getCallbackUrl() {
  return `${getBaseUrl()}/auth/callback`
}
