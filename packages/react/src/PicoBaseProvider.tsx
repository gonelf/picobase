import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { createClient, PicoBaseClient } from '@picobase/client'
import type { PicoBaseClientOptions, RecordModel, AuthEvent } from '@picobase/client'

// ── Context ───────────────────────────────────────────────────────────────────

interface PicoBaseContextValue {
  client: PicoBaseClient
  user: RecordModel | null
  loading: boolean
}

const PicoBaseContext = createContext<PicoBaseContextValue | null>(null)

// ── Provider ──────────────────────────────────────────────────────────────────

export interface PicoBaseProviderProps {
  /** Your PicoBase instance URL (e.g. `https://myapp.picobase.com`). */
  url: string
  /** Your PicoBase API key (starts with `pbk_`). */
  apiKey: string
  /** Optional client configuration. */
  options?: PicoBaseClientOptions
  children: React.ReactNode
}

/**
 * Provides PicoBase client context to all child components.
 *
 * @example
 * ```tsx
 * import { PicoBaseProvider } from '@picobase/react'
 *
 * function App() {
 *   return (
 *     <PicoBaseProvider
 *       url="https://myapp.picobase.com"
 *       apiKey="pbk_abc123_secret"
 *     >
 *       <MyApp />
 *     </PicoBaseProvider>
 *   )
 * }
 * ```
 */
export function PicoBaseProvider({ url, apiKey, options, children }: PicoBaseProviderProps) {
  const client = useMemo(
    () => createClient(url, apiKey, options),
    [url, apiKey]
  )

  const [user, setUser] = useState<RecordModel | null>(() => client.auth.user)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Sync initial state
    setUser(client.auth.user)

    // Try to refresh token on mount to validate existing session
    if (client.auth.isValid) {
      client.auth
        .refreshToken()
        .then(result => setUser(result.record))
        .catch(() => {
          // Token expired or invalid — clear it
          client.auth.signOut()
          setUser(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }

    // Listen for auth state changes
    const unsubscribe = client.auth.onStateChange((event: AuthEvent, record: RecordModel | null) => {
      setUser(record)
    })

    return unsubscribe
  }, [client])

  const value = useMemo(() => ({ client, user, loading }), [client, user, loading])

  return (
    <PicoBaseContext.Provider value={value}>
      {children}
    </PicoBaseContext.Provider>
  )
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Access the PicoBase context. Must be used within a `<PicoBaseProvider>`.
 * @internal
 */
export function usePicoBaseContext(): PicoBaseContextValue {
  const ctx = useContext(PicoBaseContext)
  if (!ctx) {
    throw new Error('usePicoBase* hooks must be used within a <PicoBaseProvider>')
  }
  return ctx
}
