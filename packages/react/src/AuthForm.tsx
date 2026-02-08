import React, { useState, FormEvent } from 'react'
import { useAuth } from './hooks'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AuthFormProps {
  /** Which view to show initially. Default: 'signIn'. */
  mode?: 'signIn' | 'signUp'
  /** OAuth providers to show as buttons (e.g. ['google', 'github']). */
  providers?: string[]
  /** URL to redirect to after successful auth. */
  redirectTo?: string
  /** Callback fired after successful sign-in or sign-up. */
  onSuccess?: (user: Record<string, unknown>) => void
  /** Callback fired on auth error. */
  onError?: (error: Error) => void
  /** Custom class for the form container. */
  className?: string
  /** Whether to show the "Forgot password?" link. Default: true. */
  showForgotPassword?: boolean
  /** Custom labels. */
  labels?: Partial<AuthFormLabels>
}

interface AuthFormLabels {
  signIn: string
  signUp: string
  email: string
  password: string
  confirmPassword: string
  forgotPassword: string
  switchToSignUp: string
  switchToSignIn: string
  orContinueWith: string
  resetPassword: string
  backToSignIn: string
  resetEmailSent: string
}

const DEFAULT_LABELS: AuthFormLabels = {
  signIn: 'Sign In',
  signUp: 'Sign Up',
  email: 'Email',
  password: 'Password',
  confirmPassword: 'Confirm Password',
  forgotPassword: 'Forgot password?',
  switchToSignUp: "Don't have an account? Sign up",
  switchToSignIn: 'Already have an account? Sign in',
  orContinueWith: 'Or continue with',
  resetPassword: 'Send Reset Link',
  backToSignIn: 'Back to sign in',
  resetEmailSent: 'If an account exists with that email, a password reset link has been sent.',
}

const PROVIDER_NAMES: Record<string, string> = {
  google: 'Google',
  github: 'GitHub',
  discord: 'Discord',
  microsoft: 'Microsoft',
  apple: 'Apple',
  twitter: 'Twitter',
}

type ViewMode = 'signIn' | 'signUp' | 'forgotPassword'

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = {
  container: {
    width: '100%',
    maxWidth: '400px',
    margin: '0 auto',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  } as React.CSSProperties,
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  } as React.CSSProperties,
  title: {
    fontSize: '24px',
    fontWeight: 600,
    textAlign: 'center' as const,
    marginBottom: '8px',
  } as React.CSSProperties,
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 500,
    marginBottom: '4px',
  } as React.CSSProperties,
  input: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    outline: 'none',
    boxSizing: 'border-box' as const,
  } as React.CSSProperties,
  button: {
    width: '100%',
    padding: '10px 16px',
    fontSize: '14px',
    fontWeight: 600,
    color: '#ffffff',
    backgroundColor: '#4f46e5',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  } as React.CSSProperties,
  buttonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  } as React.CSSProperties,
  oauthButton: {
    width: '100%',
    padding: '10px 16px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#374151',
    backgroundColor: '#ffffff',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  } as React.CSSProperties,
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    color: '#9ca3af',
    fontSize: '13px',
  } as React.CSSProperties,
  dividerLine: {
    flex: 1,
    height: '1px',
    backgroundColor: '#e5e7eb',
  } as React.CSSProperties,
  link: {
    fontSize: '14px',
    color: '#4f46e5',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    textDecoration: 'underline',
  } as React.CSSProperties,
  switchLink: {
    fontSize: '14px',
    color: '#6b7280',
    textAlign: 'center' as const,
  } as React.CSSProperties,
  error: {
    padding: '10px 12px',
    fontSize: '14px',
    color: '#dc2626',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
  } as React.CSSProperties,
  success: {
    padding: '10px 12px',
    fontSize: '14px',
    color: '#16a34a',
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: '8px',
  } as React.CSSProperties,
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Drop-in authentication form with email/password and OAuth support.
 *
 * @example
 * ```tsx
 * import { AuthForm } from '@picobase/react'
 *
 * function LoginPage() {
 *   return (
 *     <AuthForm
 *       providers={['google', 'github']}
 *       redirectTo="/dashboard"
 *       onSuccess={(user) => console.log('Authenticated:', user)}
 *     />
 *   )
 * }
 * ```
 */
export function AuthForm({
  mode = 'signIn',
  providers = [],
  redirectTo,
  onSuccess,
  onError,
  className,
  showForgotPassword = true,
  labels: customLabels,
}: AuthFormProps) {
  const { signIn, signUp, signInWithOAuth, requestPasswordReset } = useAuth()

  const labels = { ...DEFAULT_LABELS, ...customLabels }

  const [view, setView] = useState<ViewMode>(mode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      if (view === 'forgotPassword') {
        await requestPasswordReset(email)
        setResetSent(true)
        return
      }

      let result
      if (view === 'signUp') {
        if (password !== confirmPassword) {
          setError('Passwords do not match')
          return
        }
        result = await signUp(email, password)
      } else {
        result = await signIn(email, password)
      }

      onSuccess?.(result.record as unknown as Record<string, unknown>)

      if (redirectTo && typeof window !== 'undefined') {
        window.location.href = redirectTo
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error.message)
      onError?.(error)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleOAuth(provider: string) {
    setError(null)
    setSubmitting(true)

    try {
      const result = await signInWithOAuth(provider)
      onSuccess?.(result.record as unknown as Record<string, unknown>)

      if (redirectTo && typeof window !== 'undefined') {
        window.location.href = redirectTo
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error.message)
      onError?.(error)
    } finally {
      setSubmitting(false)
    }
  }

  function switchView(newView: ViewMode) {
    setView(newView)
    setError(null)
    setResetSent(false)
  }

  // ── Forgot password view ──

  if (view === 'forgotPassword') {
    return (
      <div style={styles.container} className={className}>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.title}>{labels.resetPassword}</div>

          {error && <div style={styles.error}>{error}</div>}
          {resetSent && <div style={styles.success}>{labels.resetEmailSent}</div>}

          {!resetSent && (
            <>
              <div>
                <label style={styles.label}>{labels.email}</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  style={styles.input}
                  placeholder="you@example.com"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                style={{ ...styles.button, ...(submitting ? styles.buttonDisabled : {}) }}
              >
                {submitting ? 'Sending...' : labels.resetPassword}
              </button>
            </>
          )}

          <div style={styles.switchLink}>
            <button
              type="button"
              onClick={() => switchView('signIn')}
              style={styles.link}
            >
              {labels.backToSignIn}
            </button>
          </div>
        </form>
      </div>
    )
  }

  // ── Sign in / Sign up view ──

  const isSignUp = view === 'signUp'

  return (
    <div style={styles.container} className={className}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.title}>
          {isSignUp ? labels.signUp : labels.signIn}
        </div>

        {error && <div style={styles.error}>{error}</div>}

        {/* OAuth buttons */}
        {providers.length > 0 && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {providers.map(provider => (
                <button
                  key={provider}
                  type="button"
                  onClick={() => handleOAuth(provider)}
                  disabled={submitting}
                  style={styles.oauthButton}
                >
                  {PROVIDER_NAMES[provider] || provider}
                </button>
              ))}
            </div>

            <div style={styles.divider}>
              <div style={styles.dividerLine} />
              <span>{labels.orContinueWith}</span>
              <div style={styles.dividerLine} />
            </div>
          </>
        )}

        {/* Email field */}
        <div>
          <label style={styles.label}>{labels.email}</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={styles.input}
            placeholder="you@example.com"
          />
        </div>

        {/* Password field */}
        <div>
          <label style={styles.label}>{labels.password}</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={8}
            style={styles.input}
            placeholder="Enter your password"
          />
        </div>

        {/* Confirm password (sign up only) */}
        {isSignUp && (
          <div>
            <label style={styles.label}>{labels.confirmPassword}</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              style={styles.input}
              placeholder="Confirm your password"
            />
          </div>
        )}

        {/* Forgot password link */}
        {!isSignUp && showForgotPassword && (
          <div style={{ textAlign: 'right' }}>
            <button
              type="button"
              onClick={() => switchView('forgotPassword')}
              style={{ ...styles.link, fontSize: '13px' }}
            >
              {labels.forgotPassword}
            </button>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          style={{ ...styles.button, ...(submitting ? styles.buttonDisabled : {}) }}
        >
          {submitting
            ? 'Loading...'
            : isSignUp
              ? labels.signUp
              : labels.signIn
          }
        </button>

        {/* Switch mode link */}
        <div style={styles.switchLink}>
          <button
            type="button"
            onClick={() => switchView(isSignUp ? 'signIn' : 'signUp')}
            style={styles.link}
          >
            {isSignUp ? labels.switchToSignIn : labels.switchToSignUp}
          </button>
        </div>
      </form>
    </div>
  )
}
