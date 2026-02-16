/**
 * Base error class for all PicoBase SDK errors.
 *
 * Every error includes a `code` for programmatic handling and a `fix`
 * suggestion so developers can resolve issues without digging through docs.
 */
export class PicoBaseError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status?: number,
    public readonly details?: unknown,
    /** Actionable suggestion for how to fix this error. */
    public readonly fix?: string,
  ) {
    super(message)
    this.name = 'PicoBaseError'
  }

  /** Formatted error string including fix suggestion. */
  toString(): string {
    let s = `${this.name} [${this.code}]: ${this.message}`
    if (this.fix) s += `\n  Fix: ${this.fix}`
    return s
  }
}

/**
 * Thrown when the instance is not running and cold-start retries are exhausted.
 */
export class InstanceUnavailableError extends PicoBaseError {
  constructor(message = 'Instance is not available. It may be stopped or starting up.') {
    super(
      message,
      'INSTANCE_UNAVAILABLE',
      503,
      undefined,
      'Check your instance status in the PicoBase dashboard, or wait a few seconds and retry. ' +
      'If this persists, your instance may have been stopped — restart it with `picobase status`.',
    )
    this.name = 'InstanceUnavailableError'
  }
}

/**
 * Thrown when an API key is invalid or missing.
 */
export class AuthorizationError extends PicoBaseError {
  constructor(message = 'Invalid or missing API key.') {
    super(
      message,
      'UNAUTHORIZED',
      401,
      undefined,
      'Make sure PICOBASE_API_KEY is set in your .env file and matches a valid key from your dashboard. ' +
      'Keys start with "pbk_". You can generate a new key at https://picobase.com/dashboard.',
    )
    this.name = 'AuthorizationError'
  }
}

/**
 * Thrown when a collection is not found.
 */
export class CollectionNotFoundError extends PicoBaseError {
  constructor(collectionName: string) {
    super(
      `Collection "${collectionName}" not found.`,
      'COLLECTION_NOT_FOUND',
      404,
      { collection: collectionName },
      `Make sure the collection "${collectionName}" exists in your PicoBase instance. ` +
      'Collections are auto-created when you first write data, or you can create them ' +
      'manually in the PicoBase dashboard under Collections.',
    )
    this.name = 'CollectionNotFoundError'
  }
}

/**
 * Thrown when a record is not found.
 */
export class RecordNotFoundError extends PicoBaseError {
  constructor(collectionName: string, recordId: string) {
    super(
      `Record "${recordId}" not found in collection "${collectionName}".`,
      'RECORD_NOT_FOUND',
      404,
      { collection: collectionName, recordId },
      'Check that the record ID is correct. IDs are 15-character alphanumeric strings (e.g., "abc123def456789").',
    )
    this.name = 'RecordNotFoundError'
  }
}

/**
 * Thrown when a PocketBase API request fails.
 */
export class RequestError extends PicoBaseError {
  constructor(message: string, status: number, details?: unknown) {
    const fix = requestErrorFix(status, message)
    super(message, 'REQUEST_FAILED', status, details, fix)
    this.name = 'RequestError'
  }
}

/**
 * Thrown when the SDK is misconfigured (bad URL, missing params, etc.).
 */
export class ConfigurationError extends PicoBaseError {
  constructor(message: string, fix: string) {
    super(message, 'CONFIGURATION_ERROR', undefined, undefined, fix)
    this.name = 'ConfigurationError'
  }
}

/**
 * Thrown when an RPC (remote procedure call) fails.
 */
export class RpcError extends PicoBaseError {
  constructor(functionName: string, status: number, details?: unknown) {
    const fix = rpcErrorFix(functionName, status)
    super(
      `RPC function "${functionName}" failed.`,
      'RPC_ERROR',
      status,
      details,
      fix,
    )
    this.name = 'RpcError'
  }
}

/** Generate fix suggestions for RPC errors. */
function rpcErrorFix(functionName: string, status: number): string {
  if (status === 404) {
    return `The RPC endpoint "/api/rpc/${functionName}" does not exist. ` +
      'Create a custom route in your PocketBase instance to handle this RPC call. ' +
      'See: https://pocketbase.io/docs/js-routing/'
  }
  if (status === 400) {
    return 'Check the parameters you are passing to this RPC function. ' +
      'The function may be expecting different parameters or types.'
  }
  if (status === 403) {
    return 'You don\'t have permission to call this RPC function. ' +
      'Check the authentication requirements for this endpoint in your PocketBase routes.'
  }
  return 'Check your PicoBase instance logs for details about this RPC error. ' +
    'Ensure the custom route is correctly implemented in your PocketBase setup.'
}

/** Map common HTTP statuses to actionable fixes. */
function requestErrorFix(status: number, message: string): string {
  switch (status) {
    case 400:
      return 'Check the data you are sending — a required field may be missing or have the wrong type. ' +
        'Run `picobase typegen` to regenerate types and check your field names.'
    case 403:
      return 'You don\'t have permission for this action. Check your collection API rules in the dashboard. ' +
        'By default, only authenticated users can read/write records.'
    case 404:
      if (message.toLowerCase().includes('collection'))
        return 'This collection does not exist yet. Write a record to auto-create it, or create it in the dashboard.'
      return 'The requested resource was not found. Double-check IDs and collection names.'
    case 413:
      return 'The request payload is too large. Check file upload size limits in your instance settings.'
    case 429:
      return 'Too many requests. Add a short delay between requests or implement client-side caching.'
    default:
      return 'If this error persists, check your PicoBase dashboard for instance health and logs.'
  }
}
