import { describe, it, expect } from 'vitest'
import {
  PicoBaseError,
  InstanceUnavailableError,
  AuthorizationError,
  CollectionNotFoundError,
  RecordNotFoundError,
  RequestError,
  ConfigurationError,
} from './errors'

describe('PicoBaseError', () => {
  it('should create error with code and message', () => {
    const error = new PicoBaseError('Test error', 'TEST_CODE')

    expect(error.message).toBe('Test error')
    expect(error.code).toBe('TEST_CODE')
    expect(error.name).toBe('PicoBaseError')
    expect(error.status).toBeUndefined()
    expect(error.details).toBeUndefined()
    expect(error.fix).toBeUndefined()
  })

  it('should include status and details when provided', () => {
    const details = { field: 'email' }
    const error = new PicoBaseError('Validation error', 'VALIDATION_ERROR', 400, details)

    expect(error.status).toBe(400)
    expect(error.details).toEqual(details)
  })

  it('should include fix suggestion when provided', () => {
    const error = new PicoBaseError(
      'Config error',
      'CONFIG_ERROR',
      undefined,
      undefined,
      'Check your .env file'
    )

    expect(error.fix).toBe('Check your .env file')
  })

  it('should format toString() without fix', () => {
    const error = new PicoBaseError('Test error', 'TEST_CODE')

    expect(error.toString()).toBe('PicoBaseError [TEST_CODE]: Test error')
  })

  it('should format toString() with fix suggestion', () => {
    const error = new PicoBaseError(
      'Test error',
      'TEST_CODE',
      undefined,
      undefined,
      'Try this fix'
    )

    expect(error.toString()).toBe(
      'PicoBaseError [TEST_CODE]: Test error\n  Fix: Try this fix'
    )
  })
})

describe('InstanceUnavailableError', () => {
  it('should create error with default message', () => {
    const error = new InstanceUnavailableError()

    expect(error.message).toBe('Instance is not available. It may be stopped or starting up.')
    expect(error.code).toBe('INSTANCE_UNAVAILABLE')
    expect(error.status).toBe(503)
    expect(error.name).toBe('InstanceUnavailableError')
  })

  it('should include fix suggestion', () => {
    const error = new InstanceUnavailableError()

    expect(error.fix).toContain('Check your instance status')
    expect(error.fix).toContain('picobase status')
  })

  it('should accept custom message', () => {
    const error = new InstanceUnavailableError('Custom unavailable message')

    expect(error.message).toBe('Custom unavailable message')
    expect(error.code).toBe('INSTANCE_UNAVAILABLE')
  })
})

describe('AuthorizationError', () => {
  it('should create error with default message', () => {
    const error = new AuthorizationError()

    expect(error.message).toBe('Invalid or missing API key.')
    expect(error.code).toBe('UNAUTHORIZED')
    expect(error.status).toBe(401)
    expect(error.name).toBe('AuthorizationError')
  })

  it('should include fix suggestion about API key', () => {
    const error = new AuthorizationError()

    expect(error.fix).toContain('PICOBASE_API_KEY')
    expect(error.fix).toContain('pbk_')
    expect(error.fix).toContain('.env file')
  })

  it('should accept custom message', () => {
    const error = new AuthorizationError('API key expired')

    expect(error.message).toBe('API key expired')
  })
})

describe('CollectionNotFoundError', () => {
  it('should create error with collection name in message', () => {
    const error = new CollectionNotFoundError('posts')

    expect(error.message).toBe('Collection "posts" not found.')
    expect(error.code).toBe('COLLECTION_NOT_FOUND')
    expect(error.status).toBe(404)
    expect(error.name).toBe('CollectionNotFoundError')
  })

  it('should include collection name in details', () => {
    const error = new CollectionNotFoundError('posts')

    expect(error.details).toEqual({ collection: 'posts' })
  })

  it('should include fix suggestion about auto-creation', () => {
    const error = new CollectionNotFoundError('posts')

    expect(error.fix).toContain('posts')
    expect(error.fix).toContain('auto-created')
    expect(error.fix).toContain('dashboard')
  })
})

describe('RecordNotFoundError', () => {
  it('should create error with collection and record ID in message', () => {
    const error = new RecordNotFoundError('posts', 'abc123def456789')

    expect(error.message).toBe('Record "abc123def456789" not found in collection "posts".')
    expect(error.code).toBe('RECORD_NOT_FOUND')
    expect(error.status).toBe(404)
    expect(error.name).toBe('RecordNotFoundError')
  })

  it('should include collection and recordId in details', () => {
    const error = new RecordNotFoundError('posts', 'abc123def456789')

    expect(error.details).toEqual({
      collection: 'posts',
      recordId: 'abc123def456789',
    })
  })

  it('should include fix suggestion about ID format', () => {
    const error = new RecordNotFoundError('posts', 'invalid-id')

    expect(error.fix).toContain('15-character')
    expect(error.fix).toContain('alphanumeric')
  })
})

describe('RequestError', () => {
  it('should create error with message and status', () => {
    const error = new RequestError('Bad request', 400)

    expect(error.message).toBe('Bad request')
    expect(error.code).toBe('REQUEST_FAILED')
    expect(error.status).toBe(400)
    expect(error.name).toBe('RequestError')
  })

  it('should include details when provided', () => {
    const details = { field: 'email', error: 'invalid format' }
    const error = new RequestError('Validation failed', 400, details)

    expect(error.details).toEqual(details)
  })

  it('should provide 400 specific fix suggestion', () => {
    const error = new RequestError('Bad request', 400)

    expect(error.fix).toContain('required field')
    expect(error.fix).toContain('picobase typegen')
  })

  it('should provide 403 specific fix suggestion', () => {
    const error = new RequestError('Forbidden', 403)

    expect(error.fix).toContain('permission')
    expect(error.fix).toContain('API rules')
  })

  it('should provide 404 collection-specific fix suggestion', () => {
    const error = new RequestError('Collection not found', 404)

    expect(error.fix).toContain('collection does not exist')
    expect(error.fix).toContain('auto-create')
  })

  it('should provide 404 generic fix suggestion', () => {
    const error = new RequestError('Not found', 404)

    expect(error.fix).toContain('resource was not found')
    expect(error.fix).toContain('IDs and collection names')
  })

  it('should provide 413 specific fix suggestion', () => {
    const error = new RequestError('Payload too large', 413)

    expect(error.fix).toContain('payload is too large')
    expect(error.fix).toContain('file upload size limits')
  })

  it('should provide 429 specific fix suggestion', () => {
    const error = new RequestError('Too many requests', 429)

    expect(error.fix).toContain('Too many requests')
    expect(error.fix).toContain('delay')
  })

  it('should provide default fix suggestion for unknown status', () => {
    const error = new RequestError('Server error', 500)

    expect(error.fix).toContain('persists')
    expect(error.fix).toContain('dashboard')
  })
})

describe('ConfigurationError', () => {
  it('should create error with custom message and fix', () => {
    const error = new ConfigurationError(
      'Missing URL',
      'Set PICOBASE_URL in .env'
    )

    expect(error.message).toBe('Missing URL')
    expect(error.code).toBe('CONFIGURATION_ERROR')
    expect(error.fix).toBe('Set PICOBASE_URL in .env')
    expect(error.name).toBe('ConfigurationError')
    expect(error.status).toBeUndefined()
  })

  it('should format toString() with fix suggestion', () => {
    const error = new ConfigurationError(
      'Invalid config',
      'Check your settings'
    )

    expect(error.toString()).toBe(
      'ConfigurationError [CONFIGURATION_ERROR]: Invalid config\n  Fix: Check your settings'
    )
  })
})
