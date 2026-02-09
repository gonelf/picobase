/**
 * Security utilities for public demo playground
 * Ensures demo API access is restricted and safe
 */

import { NextRequest } from 'next/server'

// Rate limiting storage (in-memory for now, use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30 // 30 requests per minute per IP

/**
 * Rate limiting middleware
 * Limits requests per IP address to prevent abuse
 */
export function checkRateLimit(request: NextRequest): { allowed: boolean; error?: string } {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
             request.headers.get('x-real-ip') ||
             'unknown'

  const now = Date.now()
  const rateLimitData = rateLimitStore.get(ip)

  if (!rateLimitData || now > rateLimitData.resetTime) {
    // New window
    rateLimitStore.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    })
    return { allowed: true }
  }

  if (rateLimitData.count >= MAX_REQUESTS_PER_WINDOW) {
    return {
      allowed: false,
      error: `Rate limit exceeded. Maximum ${MAX_REQUESTS_PER_WINDOW} requests per minute.`,
    }
  }

  // Increment count
  rateLimitData.count++
  rateLimitStore.set(ip, rateLimitData)

  return { allowed: true }
}

/**
 * Referrer validation
 * Only allows requests from trusted domains
 */
export function checkReferrer(request: NextRequest): { allowed: boolean; error?: string } {
  const referrer = request.headers.get('referer')

  // Allow localhost for development
  if (process.env.NODE_ENV === 'development') {
    return { allowed: true }
  }

  if (!referrer) {
    return {
      allowed: false,
      error: 'Referrer header required for demo access',
    }
  }

  try {
    const referrerUrl = new URL(referrer)
    const allowedDomains = [
      'picobase.com',
      'www.picobase.com',
      'localhost', // for development
    ]

    if (!allowedDomains.some(domain => referrerUrl.hostname === domain || referrerUrl.hostname.endsWith(`.${domain}`))) {
      return {
        allowed: false,
        error: 'Demo API can only be accessed from picobase.com',
      }
    }

    return { allowed: true }
  } catch {
    return {
      allowed: false,
      error: 'Invalid referrer',
    }
  }
}

/**
 * Method validation
 * Only allows safe read-only operations
 */
export function checkAllowedMethod(method: string): { allowed: boolean; error?: string } {
  const allowedMethods = ['getList', 'getOne']

  if (!allowedMethods.includes(method)) {
    return {
      allowed: false,
      error: 'Only read operations (getList, getOne) are allowed in demo mode',
    }
  }

  return { allowed: true }
}

/**
 * Combined security check
 * Runs all security validations
 */
export function validateDemoAccess(
  request: NextRequest,
  method: string
): { allowed: boolean; error?: string } {
  // Check rate limit
  const rateLimitCheck = checkRateLimit(request)
  if (!rateLimitCheck.allowed) {
    return rateLimitCheck
  }

  // Check referrer
  const referrerCheck = checkReferrer(request)
  if (!referrerCheck.allowed) {
    return referrerCheck
  }

  // Check method
  const methodCheck = checkAllowedMethod(method)
  if (!methodCheck.allowed) {
    return methodCheck
  }

  return { allowed: true }
}

/**
 * Clean up old rate limit entries periodically
 */
export function cleanupRateLimitStore() {
  const now = Date.now()
  for (const [ip, data] of rateLimitStore.entries()) {
    if (now > data.resetTime) {
      rateLimitStore.delete(ip)
    }
  }
}

// Run cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000)
}
