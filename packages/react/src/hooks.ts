import { useCallback, useEffect, useRef, useState } from 'react'
import { usePicoBaseContext } from './PicoBaseProvider'
import type { PicoBaseClient, RecordModel, AuthResponse } from '@picobase_app/client'

// ── useAuth ───────────────────────────────────────────────────────────────────

export interface UseAuthReturn {
  /** The currently authenticated user, or `null`. */
  user: RecordModel | null
  /** `true` while the initial auth state is being resolved. */
  loading: boolean
  /** `true` if a user is currently authenticated. */
  isAuthenticated: boolean
  /** Sign up a new user with email and password. */
  signUp: (email: string, password: string, data?: Record<string, unknown>) => Promise<AuthResponse>
  /** Sign in with email and password. */
  signIn: (email: string, password: string) => Promise<AuthResponse>
  /** Sign in with an OAuth2 provider. */
  signInWithOAuth: (provider: string) => Promise<AuthResponse>
  /** Sign out the current user. */
  signOut: () => void
  /** Request a password reset email. */
  requestPasswordReset: (email: string) => Promise<void>
}

/**
 * Hook for auth state and actions.
 *
 * @example
 * ```tsx
 * function ProfilePage() {
 *   const { user, loading, signOut } = useAuth()
 *
 *   if (loading) return <p>Loading...</p>
 *   if (!user) return <p>Not signed in</p>
 *
 *   return (
 *     <div>
 *       <p>Welcome, {user.email}</p>
 *       <button onClick={signOut}>Sign Out</button>
 *     </div>
 *   )
 * }
 * ```
 */
export function useAuth(): UseAuthReturn {
  const { client, user, loading } = usePicoBaseContext()

  const signUp = useCallback(
    (email: string, password: string, data?: Record<string, unknown>) =>
      client.auth.signUp({ email, password, ...data }),
    [client]
  )

  const signIn = useCallback(
    (email: string, password: string) =>
      client.auth.signIn({ email, password }),
    [client]
  )

  const signInWithOAuth = useCallback(
    (provider: string) =>
      client.auth.signInWithOAuth({ provider }),
    [client]
  )

  const signOut = useCallback(() => client.auth.signOut(), [client])

  const requestPasswordReset = useCallback(
    (email: string) => client.auth.requestPasswordReset(email),
    [client]
  )

  return {
    user,
    loading,
    isAuthenticated: !!user,
    signUp,
    signIn,
    signInWithOAuth,
    signOut,
    requestPasswordReset,
  }
}

// ── useClient ─────────────────────────────────────────────────────────────────

/**
 * Access the raw PicoBaseClient for advanced operations (collections, realtime, storage).
 *
 * @example
 * ```tsx
 * function PostsList() {
 *   const client = useClient()
 *   const [posts, setPosts] = useState([])
 *
 *   useEffect(() => {
 *     client.collection('posts').getList(1, 20).then(r => setPosts(r.items))
 *   }, [client])
 *
 *   return <ul>{posts.map(p => <li key={p.id}>{p.title}</li>)}</ul>
 * }
 * ```
 */
export function useClient(): PicoBaseClient {
  const { client } = usePicoBaseContext()
  return client
}

// ── useCollection ─────────────────────────────────────────────────────────────

export interface UseCollectionReturn<T> {
  /** The fetched records. */
  items: T[]
  /** Total number of records matching the query. */
  totalItems: number
  /** `true` while the initial fetch is in progress. */
  loading: boolean
  /** Error from the last fetch, if any. */
  error: Error | null
  /** Re-fetch the data. */
  refresh: () => void
}

/**
 * Fetch a paginated list from a PocketBase collection.
 *
 * @example
 * ```tsx
 * function PostsList() {
 *   const { items, loading, error } = useCollection('posts', { sort: '-created' })
 *
 *   if (loading) return <p>Loading...</p>
 *   if (error) return <p>Error: {error.message}</p>
 *
 *   return <ul>{items.map(p => <li key={p.id}>{p.title}</li>)}</ul>
 * }
 * ```
 */
export function useCollection<T = RecordModel>(
  collectionName: string,
  options?: {
    page?: number
    perPage?: number
    sort?: string
    filter?: string
    expand?: string
  }
): UseCollectionReturn<T> {
  const { client } = usePicoBaseContext()
  const [items, setItems] = useState<T[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const page = options?.page ?? 1
  const perPage = options?.perPage ?? 20

  // Using useState + useEffect pattern so we can do cleanup
  const doFetch = useCallback(() => {
    setLoading(true)
    setError(null)

    client
      .collection<T>(collectionName)
      .getList(page, perPage, {
        sort: options?.sort,
        filter: options?.filter,
        expand: options?.expand,
      })
      .then(result => {
        setItems(result.items)
        setTotalItems(result.totalItems)
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err : new Error(String(err)))
      })
      .finally(() => setLoading(false))
  }, [client, collectionName, page, perPage, options?.sort, options?.filter, options?.expand, refreshKey])

  // Trigger fetch on mount and dependency changes
  // Using a simple approach: call doFetch in an effect
  useState(() => { doFetch() })

  const refresh = useCallback(() => setRefreshKey(k => k + 1), [])

  return { items, totalItems, loading, error, refresh }
}

// ── useRealtime ──────────────────────────────────────────────────────────────

export interface UseRealtimeReturn<T> {
  /** The latest records, updated in realtime. */
  items: T[]
  /** `true` while the initial fetch is in progress. */
  loading: boolean
  /** Error from the last fetch or subscription, if any. */
  error: Error | null
}

/**
 * Fetch a collection and automatically subscribe to realtime updates.
 * Records stay in sync without manual polling or re-fetching.
 *
 * @example
 * ```tsx
 * function Chat() {
 *   const { items: messages, loading } = useRealtime('messages', {
 *     sort: 'created',
 *   })
 *
 *   if (loading) return <p>Loading...</p>
 *
 *   return (
 *     <ul>
 *       {messages.map(m => <li key={m.id}>{m.text}</li>)}
 *     </ul>
 *   )
 * }
 * ```
 */
export function useRealtime<T extends RecordModel = RecordModel>(
  collectionName: string,
  options?: {
    sort?: string
    filter?: string
    expand?: string
  }
): UseRealtimeReturn<T> {
  const { client } = usePicoBaseContext()
  const [items, setItems] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const unsubRef = useRef<(() => Promise<void>) | null>(null)

  useEffect(() => {
    let cancelled = false

    // Initial fetch
    client
      .collection<T>(collectionName)
      .getFullList({
        sort: options?.sort,
        filter: options?.filter,
        expand: options?.expand,
      })
      .then(records => {
        if (!cancelled) {
          setItems(records)
          setLoading(false)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)))
          setLoading(false)
        }
      })

    // Subscribe to realtime
    client
      .collection<T>(collectionName)
      .subscribe((event) => {
        if (cancelled) return

        if (event.action === 'create') {
          setItems(prev => [...prev, event.record as T])
        } else if (event.action === 'update') {
          setItems(prev =>
            prev.map(item =>
              (item as RecordModel).id === (event.record as RecordModel).id
                ? (event.record as T)
                : item
            )
          )
        } else if (event.action === 'delete') {
          setItems(prev =>
            prev.filter(item =>
              (item as RecordModel).id !== (event.record as RecordModel).id
            )
          )
        }
      })
      .then(unsub => {
        unsubRef.current = unsub
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)))
        }
      })

    return () => {
      cancelled = true
      unsubRef.current?.()
    }
  }, [client, collectionName, options?.sort, options?.filter, options?.expand])

  return { items, loading, error }
}
