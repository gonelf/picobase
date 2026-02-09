import PocketBase from 'pocketbase'
import { PicoBaseAuth } from './auth'
import { PicoBaseCollection } from './collection'
import { PicoBaseRealtime } from './realtime'
import { PicoBaseStorage } from './storage'
import { InstanceUnavailableError, AuthorizationError, CollectionNotFoundError, RecordNotFoundError, ConfigurationError } from './errors'
import type { PicoBaseClientOptions, RecordModel, SendOptions } from './types'

const DEFAULT_OPTIONS: Required<Omit<PicoBaseClientOptions, 'fetch'>> & { fetch?: typeof globalThis.fetch } = {
  timeout: 30_000,
  maxColdStartRetries: 3,
  lang: 'en-US',
}

export class PicoBaseClient {
  /** The underlying PocketBase SDK instance. Exposed for advanced usage. */
  readonly pb: PocketBase
  /** Auth module — sign up, sign in, OAuth, session management. */
  readonly auth: PicoBaseAuth
  /** Realtime module — subscribe to record changes. */
  readonly realtime: PicoBaseRealtime
  /** Storage module — get file URLs and tokens. */
  readonly storage: PicoBaseStorage

  private readonly apiKey: string
  private readonly options: typeof DEFAULT_OPTIONS

  constructor(url: string, apiKey: string, options: PicoBaseClientOptions = {}) {
    // Validate inputs with clear messages
    if (!url) {
      throw new ConfigurationError(
        'PicoBase URL is required.',
        'Pass the URL as the first argument: createClient("https://myapp.picobase.com", "pbk_...") ' +
        'or set PICOBASE_URL in your .env file.',
      )
    }
    if (!apiKey) {
      throw new ConfigurationError(
        'PicoBase API key is required.',
        'Pass the API key as the second argument: createClient("https://...", "pbk_your_key") ' +
        'or set PICOBASE_API_KEY in your .env file. Get a key from your dashboard.',
      )
    }
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      throw new ConfigurationError(
        `Invalid URL: "${url}". Must start with http:// or https://.`,
        `Use the full URL: createClient("https://${url}", "...")`,
      )
    }

    this.apiKey = apiKey
    this.options = { ...DEFAULT_OPTIONS, ...options }

    // Normalize URL — strip trailing slash
    const baseUrl = url.replace(/\/+$/, '')

    this.pb = new PocketBase(baseUrl)
    this.pb.autoCancellation(false)

    if (this.options.lang) {
      this.pb.lang = this.options.lang
    }

    // Inject API key header into every request via beforeSend hook
    this.pb.beforeSend = (url, reqInit) => {
      const headers = reqInit.headers as Record<string, string> ?? {}
      headers['X-PicoBase-Key'] = this.apiKey
      reqInit.headers = headers
      return { url, options: reqInit }
    }

    // Wrap the send method for cold-start retry logic
    this._wrapSendWithRetry()

    // Initialize modules
    this.auth = new PicoBaseAuth(this.pb)
    this.realtime = new PicoBaseRealtime(this.pb)
    this.storage = new PicoBaseStorage(this.pb)
  }

  /**
   * Access a collection for CRUD operations.
   *
   * @example
   * ```ts
   * const posts = await pb.collection('posts').getList(1, 20)
   * ```
   */
  collection<T = RecordModel>(name: string): PicoBaseCollection<T> {
    return new PicoBaseCollection<T>(this.pb, name)
  }

  /**
   * Call a server-side function (PocketBase custom API endpoint).
   * Proxies to PocketBase's send() method.
   */
  async send<T = unknown>(path: string, options?: SendOptions): Promise<T> {
    return this.pb.send<T>(path, options ?? {})
  }

  /**
   * Get the current auth token (if signed in), or empty string.
   */
  get token(): string {
    return this.pb.authStore.token
  }

  /**
   * Check if a user is currently authenticated.
   */
  get isAuthenticated(): boolean {
    return this.pb.authStore.isValid
  }

  /**
   * Monkey-patch pb.send to retry on 503 (cold start).
   *
   * When an instance is stopped or starting, the proxy returns 503.
   * The SDK automatically retries with exponential backoff so the developer
   * doesn't have to handle cold-start logic.
   */
  private _wrapSendWithRetry(): void {
    const originalSend = this.pb.send.bind(this.pb)
    const maxRetries = this.options.maxColdStartRetries

    this.pb.send = async <T>(path: string, options: SendOptions): Promise<T> => {
      let lastError: unknown

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          return await originalSend<T>(path, options)
        } catch (err: unknown) {
          lastError = err

          // Check if this is a 503 (instance starting up)
          const status = (err as { status?: number })?.status
          if (status === 503 && attempt < maxRetries) {
            // Exponential backoff: 2s, 4s, 8s
            const delay = Math.pow(2, attempt + 1) * 1000
            await new Promise(resolve => setTimeout(resolve, delay))
            continue
          }

          // Check if this is a 401 from our gateway (bad API key)
          if (status === 401) {
            const data = (err as { data?: { code?: string } })?.data
            if (data?.code === 'INVALID_API_KEY') {
              throw new AuthorizationError()
            }
          }

          // Detect collection-not-found for a clearer message
          if (status === 404) {
            const msg = (err as { message?: string })?.message ?? ''
            if (msg.toLowerCase().includes('missing collection') || msg.toLowerCase().includes('not found collection')) {
              const match = msg.match(/["']([^"']+)["']/)
              throw new CollectionNotFoundError(match?.[1] ?? 'unknown')
            }
          }

          throw err
        }
      }

      throw new InstanceUnavailableError(
        `Instance unavailable after ${maxRetries} retries. ` +
        `Original error: ${lastError instanceof Error ? lastError.message : String(lastError)}`
      )
    }
  }
}

/**
 * Create a new PicoBase client.
 *
 * Can be called with explicit URL and API key, or with zero arguments to
 * auto-detect from environment variables (`PICOBASE_URL` / `NEXT_PUBLIC_PICOBASE_URL`
 * and `PICOBASE_API_KEY` / `NEXT_PUBLIC_PICOBASE_API_KEY`).
 *
 * @example
 * ```ts
 * import { createClient } from '@picobase_app/client'
 *
 * // Zero-config — reads from env vars
 * const pb = createClient()
 *
 * // Or explicit
 * const pb = createClient('https://myapp.picobase.com', 'pbk_abc123_secret')
 *
 * // Sign up a user
 * const user = await pb.auth.signUp({
 *   email: 'user@example.com',
 *   password: 'securepassword',
 * })
 *
 * // Query records
 * const posts = await pb.collection('posts').getList(1, 20, {
 *   filter: 'published = true',
 *   sort: '-created',
 * })
 * ```
 */
export function createClient(options?: PicoBaseClientOptions): PicoBaseClient
export function createClient(url: string, apiKey: string, options?: PicoBaseClientOptions): PicoBaseClient
export function createClient(
  urlOrOptions?: string | PicoBaseClientOptions,
  apiKeyOrUndefined?: string,
  options?: PicoBaseClientOptions,
): PicoBaseClient {
  // Zero-arg / options-only: read from env
  if (typeof urlOrOptions !== 'string') {
    const env = typeof process !== 'undefined' ? process.env : {} as Record<string, string | undefined>
    const url = env.PICOBASE_URL || env.NEXT_PUBLIC_PICOBASE_URL
    const apiKey = env.PICOBASE_API_KEY || env.NEXT_PUBLIC_PICOBASE_API_KEY

    if (!url || !apiKey) {
      const missing = [
        !url && 'PICOBASE_URL (or NEXT_PUBLIC_PICOBASE_URL)',
        !apiKey && 'PICOBASE_API_KEY (or NEXT_PUBLIC_PICOBASE_API_KEY)',
      ].filter(Boolean).join(' and ')

      throw new ConfigurationError(
        `Missing environment variable${!url && !apiKey ? 's' : ''}: ${missing}`,
        'Add them to your .env.local file:\n\n' +
        '  PICOBASE_URL=https://your-app.picobase.com\n' +
        '  PICOBASE_API_KEY=pbk_your_key_here\n\n' +
        'Or for Next.js (client-side access), prefix with NEXT_PUBLIC_:\n\n' +
        '  NEXT_PUBLIC_PICOBASE_URL=https://your-app.picobase.com\n' +
        '  NEXT_PUBLIC_PICOBASE_API_KEY=pbk_your_key_here\n\n' +
        'Get your URL and API key from: https://picobase.com/dashboard\n' +
        'Or run: picobase init',
      )
    }

    return new PicoBaseClient(url, apiKey, urlOrOptions)
  }

  return new PicoBaseClient(urlOrOptions, apiKeyOrUndefined!, options)
}
