import type PocketBase from 'pocketbase'
import type {
  AuthResponse,
  AuthStateChangeCallback,
  AuthEvent,
  SignUpOptions,
  SignInOptions,
  OAuthSignInOptions,
  RecordModel,
} from './types'

/**
 * Auth module — handles user sign-up, sign-in, OAuth, and session management.
 *
 * PicoBase uses PocketBase's built-in `users` collection for auth. Each
 * instance has its own isolated user pool.
 *
 * @example
 * ```ts
 * // Sign up
 * const { token, record } = await pb.auth.signUp({
 *   email: 'user@example.com',
 *   password: 'securepassword',
 * })
 *
 * // Sign in
 * const { token, record } = await pb.auth.signIn({
 *   email: 'user@example.com',
 *   password: 'securepassword',
 * })
 *
 * // Listen to auth changes
 * pb.auth.onStateChange((event, record) => {
 *   console.log(event, record)
 * })
 * ```
 */
export class PicoBaseAuth {
  private pb: PocketBase
  private listeners: Set<AuthStateChangeCallback> = new Set()
  private _collection: string = 'users'

  constructor(pb: PocketBase) {
    this.pb = pb

    // Listen to PocketBase auth store changes and re-emit
    this.pb.authStore.onChange((token) => {
      const record = this.pb.authStore.record ?? null
      const event: AuthEvent = token ? 'SIGNED_IN' : 'SIGNED_OUT'
      this._notify(event, record)
    })
  }

  /**
   * Set which collection to authenticate against.
   * Defaults to 'users'. Use this if you have a custom auth collection.
   */
  setCollection(name: string): this {
    this._collection = name
    return this
  }

  /**
   * Create a new user account.
   */
  async signUp(options: SignUpOptions): Promise<AuthResponse> {
    const { email, password, passwordConfirm, ...rest } = options

    const record = await this.pb.collection(this._collection).create<RecordModel>({
      email,
      password,
      passwordConfirm: passwordConfirm ?? password,
      ...rest,
    })

    // Automatically sign in after sign-up
    const authResult = await this.pb
      .collection(this._collection)
      .authWithPassword<RecordModel>(email, password)

    return {
      token: authResult.token,
      record: authResult.record,
    }
  }

  /**
   * Sign in with email and password.
   */
  async signIn(options: SignInOptions): Promise<AuthResponse> {
    const result = await this.pb
      .collection(this._collection)
      .authWithPassword<RecordModel>(options.email, options.password)

    return {
      token: result.token,
      record: result.record,
    }
  }

  /**
   * Sign in with an OAuth2 provider (Google, GitHub, etc.).
   *
   * In browser environments this opens a popup/redirect to the provider.
   * Configure providers in your PicoBase dashboard.
   */
  async signInWithOAuth(options: OAuthSignInOptions): Promise<AuthResponse> {
    const result = await this.pb.collection(this._collection).authWithOAuth2({
      provider: options.provider,
      scopes: options.scopes,
      createData: options.createData,
      urlCallback: options.urlCallback,
    })

    return {
      token: result.token,
      record: result.record,
    }
  }

  /**
   * Refresh the current auth token.
   */
  async refreshToken(): Promise<AuthResponse> {
    const result = await this.pb.collection(this._collection).authRefresh<RecordModel>()
    this._notify('TOKEN_REFRESHED', result.record)
    return {
      token: result.token,
      record: result.record,
    }
  }

  /**
   * Send a password reset email.
   */
  async requestPasswordReset(email: string): Promise<void> {
    await this.pb.collection(this._collection).requestPasswordReset(email)
  }

  /**
   * Confirm a password reset with the token from the reset email.
   */
  async confirmPasswordReset(
    token: string,
    password: string,
    passwordConfirm?: string,
  ): Promise<void> {
    await this.pb
      .collection(this._collection)
      .confirmPasswordReset(token, password, passwordConfirm ?? password)
  }

  /**
   * Send an email verification email.
   */
  async requestVerification(email: string): Promise<void> {
    await this.pb.collection(this._collection).requestVerification(email)
  }

  /**
   * Confirm email verification with the token from the verification email.
   */
  async confirmVerification(token: string): Promise<void> {
    await this.pb.collection(this._collection).confirmVerification(token)
  }

  /**
   * Sign out the current user. Clears the local auth store.
   */
  signOut(): void {
    this.pb.authStore.clear()
  }

  /**
   * Get the currently authenticated user record, or `null` if not signed in.
   */
  get user(): RecordModel | null {
    return this.pb.authStore.record
  }

  /**
   * Get the current auth token, or empty string if not signed in.
   */
  get token(): string {
    return this.pb.authStore.token
  }

  /**
   * Check if the current auth session is valid (token exists and not expired).
   */
  get isValid(): boolean {
    return this.pb.authStore.isValid
  }

  /**
   * Listen to auth state changes. Returns an unsubscribe function.
   *
   * @example
   * ```ts
   * const unsubscribe = pb.auth.onStateChange((event, record) => {
   *   if (event === 'SIGNED_IN') {
   *     console.log('Welcome', record.email)
   *   }
   * })
   *
   * // Later:
   * unsubscribe()
   * ```
   */
  onStateChange(callback: AuthStateChangeCallback): () => void {
    this.listeners.add(callback)
    return () => {
      this.listeners.delete(callback)
    }
  }

  private _notify(event: AuthEvent, record: RecordModel | null): void {
    for (const cb of this.listeners) {
      try {
        cb(event, record)
      } catch {
        // Don't let one listener crash others
      }
    }
  }
}
