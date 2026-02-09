import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { PicoBaseProvider } from './PicoBaseProvider'
import { useAuth, useClient, useCollection } from './hooks'
import React from 'react'

// Wrapper component for hooks
function createWrapper(url = 'https://test.picobase.com', apiKey = 'pbk_test') {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <PicoBaseProvider url={url} apiKey={apiKey}>
        {children}
      </PicoBaseProvider>
    )
  }
}

describe('useAuth', () => {
  it('should return auth state and methods', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    })

    expect(result.current).toHaveProperty('user')
    expect(result.current).toHaveProperty('loading')
    expect(result.current).toHaveProperty('isAuthenticated')
    expect(result.current).toHaveProperty('signUp')
    expect(result.current).toHaveProperty('signIn')
    expect(result.current).toHaveProperty('signOut')
    expect(result.current).toHaveProperty('signInWithOAuth')
    expect(result.current).toHaveProperty('requestPasswordReset')
  })

  it('should start with null user when not authenticated', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    })

    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('should provide sign in method', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    })

    expect(typeof result.current.signIn).toBe('function')
  })

  it('should provide sign up method', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    })

    expect(typeof result.current.signUp).toBe('function')
  })

  it('should provide sign out method', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    })

    expect(typeof result.current.signOut).toBe('function')
  })

  it('should provide OAuth sign in method', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    })

    expect(typeof result.current.signInWithOAuth).toBe('function')
  })

  it('should provide password reset method', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    })

    expect(typeof result.current.requestPasswordReset).toBe('function')
  })

  it('should throw error when used outside provider', () => {
    // Suppress console error
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      renderHook(() => useAuth())
    }).toThrow('usePicoBase* hooks must be used within a <PicoBaseProvider>')

    consoleSpy.mockRestore()
  })
})

describe('useClient', () => {
  it('should return PicoBaseClient instance', () => {
    const { result } = renderHook(() => useClient(), {
      wrapper: createWrapper(),
    })

    expect(result.current).toBeDefined()
    expect(result.current).toHaveProperty('collection')
    expect(result.current).toHaveProperty('auth')
    expect(result.current).toHaveProperty('realtime')
    expect(result.current).toHaveProperty('storage')
  })

  it('should return same client instance on re-render', () => {
    const { result, rerender } = renderHook(() => useClient(), {
      wrapper: createWrapper(),
    })

    const firstClient = result.current
    rerender()
    const secondClient = result.current

    expect(firstClient).toBe(secondClient)
  })

  it('should throw error when used outside provider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      renderHook(() => useClient())
    }).toThrow('usePicoBase* hooks must be used within a <PicoBaseProvider>')

    consoleSpy.mockRestore()
  })
})

describe('useCollection', () => {
  it('should return collection query state', () => {
    const { result } = renderHook(() => useCollection('posts'), {
      wrapper: createWrapper(),
    })

    expect(result.current).toHaveProperty('items')
    expect(result.current).toHaveProperty('totalItems')
    expect(result.current).toHaveProperty('loading')
    expect(result.current).toHaveProperty('error')
    expect(result.current).toHaveProperty('refresh')
  })

  it('should start with empty items array', () => {
    const { result } = renderHook(() => useCollection('posts'), {
      wrapper: createWrapper(),
    })

    expect(result.current.items).toEqual([])
  })

  it('should start with totalItems of 0', () => {
    const { result } = renderHook(() => useCollection('posts'), {
      wrapper: createWrapper(),
    })

    expect(result.current.totalItems).toBe(0)
  })

  it('should start with loading state', () => {
    const { result } = renderHook(() => useCollection('posts'), {
      wrapper: createWrapper(),
    })

    expect(result.current.loading).toBe(true)
  })

  it('should start with null error', () => {
    const { result } = renderHook(() => useCollection('posts'), {
      wrapper: createWrapper(),
    })

    expect(result.current.error).toBeNull()
  })

  it('should provide refresh method', () => {
    const { result } = renderHook(() => useCollection('posts'), {
      wrapper: createWrapper(),
    })

    expect(typeof result.current.refresh).toBe('function')
  })

  it('should accept pagination options', () => {
    const { result } = renderHook(
      () => useCollection('posts', { page: 2, perPage: 10 }),
      { wrapper: createWrapper() }
    )

    expect(result.current).toBeDefined()
  })

  it('should accept filter and sort options', () => {
    const { result } = renderHook(
      () => useCollection('posts', {
        filter: 'published = true',
        sort: '-created',
      }),
      { wrapper: createWrapper() }
    )

    expect(result.current).toBeDefined()
  })

  it('should throw error when used outside provider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      renderHook(() => useCollection('posts'))
    }).toThrow('usePicoBase* hooks must be used within a <PicoBaseProvider>')

    consoleSpy.mockRestore()
  })
})
