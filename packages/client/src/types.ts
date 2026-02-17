import type PocketBase from 'pocketbase'
import type { RecordModel, RecordSubscription, SendOptions } from 'pocketbase'

// ── Client options ──────────────────────────────────────────────────────────

export interface PicoBaseClientOptions {
  /**
   * Timeout in ms for individual requests. Default: 30_000 (30s).
   */
  timeout?: number

  /**
   * Max automatic retries on 503 (instance cold-starting). Default: 3.
   */
  maxColdStartRetries?: number

  /**
   * Custom fetch implementation (useful for testing or server-side usage).
   */
  fetch?: typeof globalThis.fetch

  /**
   * Language code sent as Accept-Language header. Default: 'en-US'.
   */
  lang?: string
}

// ── Auth types ──────────────────────────────────────────────────────────────

export interface AuthResponse {
  token: string
  record: RecordModel
}

export type AuthEvent =
  | 'SIGNED_IN'
  | 'SIGNED_OUT'
  | 'TOKEN_REFRESHED'

export interface AuthStateChange {
  event: AuthEvent
  token: string
  record: RecordModel | null
}

export type AuthStateChangeCallback = (event: AuthEvent, record: RecordModel | null) => void

export interface SignUpOptions {
  email: string
  password: string
  passwordConfirm?: string
  name?: string
  [key: string]: unknown
}

export interface SignInOptions {
  email: string
  password: string
}

export interface OAuthSignInOptions {
  provider: string
  scopes?: string[]
  createData?: Record<string, unknown>
  urlCallback?: (url: string) => void | Promise<void>
}

// ── Realtime types ──────────────────────────────────────────────────────────

export type RealtimeAction = 'create' | 'update' | 'delete'

export interface RealtimeCallback<T = RecordModel> {
  (data: RecordSubscription<T>): void
}

export type UnsubscribeFunc = () => Promise<void>

// ── Storage types ───────────────────────────────────────────────────────────

export interface FileOptions {
  thumb?: string
  token?: string
  download?: boolean
}

// ── Collection types ────────────────────────────────────────────────────────

export type CollectionType = 'base' | 'auth' | 'view'

export interface CollectionModel {
  id: string
  created: string
  updated: string
  name: string
  type: CollectionType
  system: boolean
  schema: SchemaField[]
  indexes: string[]
  listRule: string | null
  viewRule: string | null
  createRule: string | null
  updateRule: string | null
  deleteRule: string | null
  options: Record<string, unknown>
}

export interface SchemaField {
  system: boolean
  id: string
  name: string
  type: string
  required: boolean
  presentable: boolean
  unique: boolean
  options: Record<string, unknown>
}

// ── Re-exports for convenience ──────────────────────────────────────────────

export type { RecordModel, RecordSubscription, SendOptions, PocketBase }
