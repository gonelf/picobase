export { createClient, PicoBaseClient } from './client'
export { PicoBaseAuth } from './auth'
export { PicoBaseCollection } from './collection'
export { PicoBaseRealtime } from './realtime'
export { PicoBaseStorage } from './storage'
export { PicoBaseError, InstanceUnavailableError, AuthorizationError, RequestError } from './errors'

// Collection types
export type { ListOptions, RecordQueryOptions } from './collection'

export type {
  PicoBaseClientOptions,
  AuthResponse,
  AuthEvent,
  AuthStateChange,
  AuthStateChangeCallback,
  SignUpOptions,
  SignInOptions,
  OAuthSignInOptions,
  RealtimeAction,
  RealtimeCallback,
  UnsubscribeFunc,
  FileOptions,
  RecordModel,
} from './types'
