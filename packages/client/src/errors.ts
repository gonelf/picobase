/**
 * Base error class for all PicoBase SDK errors.
 */
export class PicoBaseError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status?: number,
    public readonly details?: unknown,
  ) {
    super(message)
    this.name = 'PicoBaseError'
  }
}

/**
 * Thrown when the instance is not running and cold-start retries are exhausted.
 */
export class InstanceUnavailableError extends PicoBaseError {
  constructor(message = 'Instance is not available. It may be stopped or starting up.') {
    super(message, 'INSTANCE_UNAVAILABLE', 503)
    this.name = 'InstanceUnavailableError'
  }
}

/**
 * Thrown when an API key is invalid or missing.
 */
export class AuthorizationError extends PicoBaseError {
  constructor(message = 'Invalid or missing API key.') {
    super(message, 'UNAUTHORIZED', 401)
    this.name = 'AuthorizationError'
  }
}

/**
 * Thrown when a PocketBase API request fails.
 */
export class RequestError extends PicoBaseError {
  constructor(message: string, status: number, details?: unknown) {
    super(message, 'REQUEST_FAILED', status, details)
    this.name = 'RequestError'
  }
}
