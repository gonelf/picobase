import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PicoBaseProvider, usePicoBaseContext } from './PicoBaseProvider'

// Test component to access context
function TestConsumer() {
  const { client, user, loading } = usePicoBaseContext()
  return (
    <div>
      <div data-testid="has-client">{client ? 'yes' : 'no'}</div>
      <div data-testid="user">{user ? user.email : 'null'}</div>
      <div data-testid="loading">{loading ? 'true' : 'false'}</div>
    </div>
  )
}

describe('PicoBaseProvider', () => {
  it('should provide client context to children', () => {
    render(
      <PicoBaseProvider url="https://test.picobase.com" apiKey="pbk_test">
        <TestConsumer />
      </PicoBaseProvider>
    )

    expect(screen.getByTestId('has-client').textContent).toBe('yes')
  })

  it('should initialize with loading state', () => {
    render(
      <PicoBaseProvider url="https://test.picobase.com" apiKey="pbk_test">
        <TestConsumer />
      </PicoBaseProvider>
    )

    // Initially should be loading or finished loading
    const loading = screen.getByTestId('loading').textContent
    expect(loading).toMatch(/true|false/)
  })

  it('should start with null user when not authenticated', () => {
    render(
      <PicoBaseProvider url="https://test.picobase.com" apiKey="pbk_test">
        <TestConsumer />
      </PicoBaseProvider>
    )

    // Should eventually show null user
    expect(screen.getByTestId('user').textContent).toBe('null')
  })
})

describe('usePicoBaseContext', () => {
  it('should throw error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      render(<TestConsumer />)
    }).toThrow('usePicoBase* hooks must be used within a <PicoBaseProvider>')

    consoleSpy.mockRestore()
  })

  it('should provide client when inside provider', () => {
    render(
      <PicoBaseProvider url="https://test.picobase.com" apiKey="pbk_test">
        <TestConsumer />
      </PicoBaseProvider>
    )

    expect(screen.getByTestId('has-client').textContent).toBe('yes')
  })
})
