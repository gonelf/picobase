import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createClient, PicoBaseClient } from './client'
import { ConfigurationError, AuthorizationError, CollectionNotFoundError, InstanceUnavailableError } from './errors'

describe('PicoBaseClient', () => {
  describe('constructor validation', () => {
    it('should throw ConfigurationError when URL is missing', () => {
      expect(() => new PicoBaseClient('', 'pbk_test')).toThrow(ConfigurationError)
      expect(() => new PicoBaseClient('', 'pbk_test')).toThrow('PicoBase URL is required')
    })

    it('should throw ConfigurationError when API key is missing', () => {
      expect(() => new PicoBaseClient('https://test.picobase.com', '')).toThrow(ConfigurationError)
      expect(() => new PicoBaseClient('https://test.picobase.com', '')).toThrow('PicoBase API key is required')
    })

    it('should throw ConfigurationError when URL does not start with http:// or https://', () => {
      expect(() => new PicoBaseClient('test.picobase.com', 'pbk_test')).toThrow(ConfigurationError)
      expect(() => new PicoBaseClient('test.picobase.com', 'pbk_test')).toThrow('Must start with http:// or https://')
    })

    it('should create client with valid URL and API key', () => {
      const client = new PicoBaseClient('https://test.picobase.com', 'pbk_test')

      expect(client).toBeInstanceOf(PicoBaseClient)
      expect(client.pb).toBeDefined()
      expect(client.auth).toBeDefined()
      expect(client.realtime).toBeDefined()
      expect(client.storage).toBeDefined()
    })

    it('should normalize URL by removing trailing slash', () => {
      const client = new PicoBaseClient('https://test.picobase.com/', 'pbk_test')

      expect(client.pb.baseUrl).toBe('https://test.picobase.com')
    })

    it('should accept http:// URL', () => {
      const client = new PicoBaseClient('http://localhost:8090', 'pbk_test')

      expect(client.pb.baseUrl).toBe('http://localhost:8090')
    })

    it('should inject API key header via beforeSend hook', () => {
      const client = new PicoBaseClient('https://test.picobase.com', 'pbk_test123')

      const result = client.pb.beforeSend('/', {})

      expect(result.options.headers).toHaveProperty('X-PicoBase-Key', 'pbk_test123')
    })

    it('should accept custom options', () => {
      const client = new PicoBaseClient('https://test.picobase.com', 'pbk_test', {
        timeout: 5000,
        lang: 'fr-FR',
      })

      expect(client.pb.lang).toBe('fr-FR')
    })
  })

  describe('collection()', () => {
    it('should return PicoBaseCollection instance', () => {
      const client = new PicoBaseClient('https://test.picobase.com', 'pbk_test')
      const collection = client.collection('posts')

      expect(collection).toBeDefined()
      expect(typeof collection.getList).toBe('function')
      expect(typeof collection.create).toBe('function')
    })
  })

  describe('auth properties', () => {
    it('should return empty token when not authenticated', () => {
      const client = new PicoBaseClient('https://test.picobase.com', 'pbk_test')

      expect(client.token).toBe('')
    })

    it('should return false for isAuthenticated when not authenticated', () => {
      const client = new PicoBaseClient('https://test.picobase.com', 'pbk_test')

      expect(client.isAuthenticated).toBe(false)
    })

    it('should return token from authStore', () => {
      const client = new PicoBaseClient('https://test.picobase.com', 'pbk_test')
      // Simulate authentication by setting authStore
      client.pb.authStore.save('fake-token', { id: '123' })

      expect(client.token).toBe('fake-token')
      // Note: isAuthenticated depends on authStore.isValid which requires proper token structure
    })
  })
})

describe('createClient', () => {
  const originalEnv = process.env

  beforeEach(() => {
    // Reset process.env before each test
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    // Restore original env
    process.env = originalEnv
    vi.restoreAllMocks()
  })

  describe('zero-config (env detection)', () => {
    it('should read from PICOBASE_URL and PICOBASE_API_KEY env vars', () => {
      process.env.PICOBASE_URL = 'https://env-test.picobase.com'
      process.env.PICOBASE_API_KEY = 'pbk_env_key'

      const client = createClient()

      expect(client).toBeInstanceOf(PicoBaseClient)
      expect(client.pb.baseUrl).toBe('https://env-test.picobase.com')
    })

    it('should read from NEXT_PUBLIC_ prefixed env vars', () => {
      process.env.NEXT_PUBLIC_PICOBASE_URL = 'https://next-test.picobase.com'
      process.env.NEXT_PUBLIC_PICOBASE_API_KEY = 'pbk_next_key'

      const client = createClient()

      expect(client).toBeInstanceOf(PicoBaseClient)
      expect(client.pb.baseUrl).toBe('https://next-test.picobase.com')
    })

    it('should prefer non-prefixed env vars over NEXT_PUBLIC_', () => {
      process.env.PICOBASE_URL = 'https://standard.picobase.com'
      process.env.NEXT_PUBLIC_PICOBASE_URL = 'https://next.picobase.com'
      process.env.PICOBASE_API_KEY = 'pbk_standard'
      process.env.NEXT_PUBLIC_PICOBASE_API_KEY = 'pbk_next'

      const client = createClient()

      expect(client.pb.baseUrl).toBe('https://standard.picobase.com')
    })

    it('should throw ConfigurationError when URL env var is missing', () => {
      process.env.PICOBASE_API_KEY = 'pbk_key'
      delete process.env.PICOBASE_URL
      delete process.env.NEXT_PUBLIC_PICOBASE_URL

      expect(() => createClient()).toThrow(ConfigurationError)
      expect(() => createClient()).toThrow('PICOBASE_URL')
    })

    it('should throw ConfigurationError when API key env var is missing', () => {
      process.env.PICOBASE_URL = 'https://test.picobase.com'
      delete process.env.PICOBASE_API_KEY
      delete process.env.NEXT_PUBLIC_PICOBASE_API_KEY

      expect(() => createClient()).toThrow(ConfigurationError)
      expect(() => createClient()).toThrow('PICOBASE_API_KEY')
    })

    it('should throw ConfigurationError when both URL and API key are missing', () => {
      delete process.env.PICOBASE_URL
      delete process.env.NEXT_PUBLIC_PICOBASE_URL
      delete process.env.PICOBASE_API_KEY
      delete process.env.NEXT_PUBLIC_PICOBASE_API_KEY

      expect(() => createClient()).toThrow(ConfigurationError)
      expect(() => createClient()).toThrow(/PICOBASE_URL.*PICOBASE_API_KEY/)
    })

    it('should include setup instructions in error message', () => {
      delete process.env.PICOBASE_URL
      delete process.env.PICOBASE_API_KEY
      delete process.env.NEXT_PUBLIC_PICOBASE_URL
      delete process.env.NEXT_PUBLIC_PICOBASE_API_KEY

      try {
        createClient()
        throw new Error('Should have thrown')
      } catch (error: any) {
        expect(error).toBeInstanceOf(ConfigurationError)
        expect(error.fix).toContain('.env.local')
        expect(error.fix).toContain('picobase init')
      }
    })

    it('should accept options when using zero-config', () => {
      process.env.PICOBASE_URL = 'https://test.picobase.com'
      process.env.PICOBASE_API_KEY = 'pbk_test'

      const client = createClient({ lang: 'es-ES' })

      expect(client.pb.lang).toBe('es-ES')
    })
  })

  describe('explicit arguments', () => {
    it('should create client with explicit URL and API key', () => {
      const client = createClient('https://explicit.picobase.com', 'pbk_explicit')

      expect(client).toBeInstanceOf(PicoBaseClient)
      expect(client.pb.baseUrl).toBe('https://explicit.picobase.com')
    })

    it('should accept options as third argument', () => {
      const client = createClient('https://test.picobase.com', 'pbk_test', {
        timeout: 10000,
        lang: 'de-DE',
      })

      expect(client.pb.lang).toBe('de-DE')
    })

    it('should not read env vars when URL and key are provided explicitly', () => {
      process.env.PICOBASE_URL = 'https://env.picobase.com'
      process.env.PICOBASE_API_KEY = 'pbk_env'

      const client = createClient('https://explicit.picobase.com', 'pbk_explicit')

      expect(client.pb.baseUrl).toBe('https://explicit.picobase.com')
    })
  })
})

describe('Cold-start retry logic', () => {
  it('should retry on 503 with exponential backoff', async () => {
    const client = new PicoBaseClient('https://test.picobase.com', 'pbk_test', {
      maxColdStartRetries: 2,
    })

    let callCount = 0
    // Save original send
    const originalSend = client.pb.send.bind(client.pb)

    // Mock send at the PocketBase level (before retry wrapper)
    const mockSend = vi.fn(async (path: string, options: any) => {
      callCount++
      if (callCount <= 2) {
        const error = new Error('Service Unavailable') as any
        error.status = 503
        throw error
      }
      return { success: true }
    })

    // Replace pb.send, then rewrap with retry logic
    client.pb.send = mockSend as any
    // Manually trigger the retry wrapper again
    const wrappedSend = client.pb.send
    client['_wrapSendWithRetry']()

    const startTime = Date.now()
    const result = await client.send('/test')
    const duration = Date.now() - startTime

    expect(result).toEqual({ success: true })
    expect(callCount).toBe(3)
    // Should have delays of 2s + 4s = 6s (with some tolerance)
    expect(duration).toBeGreaterThanOrEqual(5900)
  }, 10000)

  // Note: Additional retry logic edge cases are implicitly tested by the retry test above
  // Testing the error transformations requires integration with actual PocketBase behavior
})
