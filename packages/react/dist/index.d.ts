import * as react_jsx_runtime from 'react/jsx-runtime';
import React from 'react';
import { PicoBaseClientOptions, RecordModel, AuthResponse, PicoBaseClient } from '@picobase_app/client';
export { AuthResponse, PicoBaseClient, RecordModel } from '@picobase_app/client';

interface PicoBaseProviderProps {
    /** Your PicoBase instance URL (e.g. `https://myapp.picobase.com`). */
    url: string;
    /** Your PicoBase API key (starts with `pbk_`). */
    apiKey: string;
    /** Optional client configuration. */
    options?: PicoBaseClientOptions;
    children: React.ReactNode;
}
/**
 * Provides PicoBase client context to all child components.
 *
 * @example
 * ```tsx
 * import { PicoBaseProvider } from '@picobase_app/react'
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
declare function PicoBaseProvider({ url, apiKey, options, children }: PicoBaseProviderProps): react_jsx_runtime.JSX.Element;

interface UseAuthReturn {
    /** The currently authenticated user, or `null`. */
    user: RecordModel | null;
    /** `true` while the initial auth state is being resolved. */
    loading: boolean;
    /** `true` if a user is currently authenticated. */
    isAuthenticated: boolean;
    /** Sign up a new user with email and password. */
    signUp: (email: string, password: string, data?: Record<string, unknown>) => Promise<AuthResponse>;
    /** Sign in with email and password. */
    signIn: (email: string, password: string) => Promise<AuthResponse>;
    /** Sign in with an OAuth2 provider. */
    signInWithOAuth: (provider: string) => Promise<AuthResponse>;
    /** Sign out the current user. */
    signOut: () => void;
    /** Request a password reset email. */
    requestPasswordReset: (email: string) => Promise<void>;
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
declare function useAuth(): UseAuthReturn;
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
declare function useClient(): PicoBaseClient;
interface UseCollectionReturn<T> {
    /** The fetched records. */
    items: T[];
    /** Total number of records matching the query. */
    totalItems: number;
    /** `true` while the initial fetch is in progress. */
    loading: boolean;
    /** Error from the last fetch, if any. */
    error: Error | null;
    /** Re-fetch the data. */
    refresh: () => void;
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
declare function useCollection<T = RecordModel>(collectionName: string, options?: {
    page?: number;
    perPage?: number;
    sort?: string;
    filter?: string;
    expand?: string;
}): UseCollectionReturn<T>;
interface UseRealtimeReturn<T> {
    /** The latest records, updated in realtime. */
    items: T[];
    /** `true` while the initial fetch is in progress. */
    loading: boolean;
    /** Error from the last fetch or subscription, if any. */
    error: Error | null;
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
declare function useRealtime<T extends RecordModel = RecordModel>(collectionName: string, options?: {
    sort?: string;
    filter?: string;
    expand?: string;
}): UseRealtimeReturn<T>;

interface AuthFormProps {
    /** Which view to show initially. Default: 'signIn'. */
    mode?: 'signIn' | 'signUp';
    /** OAuth providers to show as buttons (e.g. ['google', 'github']). */
    providers?: string[];
    /** URL to redirect to after successful auth. */
    redirectTo?: string;
    /** Callback fired after successful sign-in or sign-up. */
    onSuccess?: (user: Record<string, unknown>) => void;
    /** Callback fired on auth error. */
    onError?: (error: Error) => void;
    /** Custom class for the form container. */
    className?: string;
    /** Whether to show the "Forgot password?" link. Default: true. */
    showForgotPassword?: boolean;
    /** Custom labels. */
    labels?: Partial<AuthFormLabels>;
}
interface AuthFormLabels {
    signIn: string;
    signUp: string;
    email: string;
    password: string;
    confirmPassword: string;
    forgotPassword: string;
    switchToSignUp: string;
    switchToSignIn: string;
    orContinueWith: string;
    resetPassword: string;
    backToSignIn: string;
    resetEmailSent: string;
}
/**
 * Drop-in authentication form with email/password and OAuth support.
 *
 * @example
 * ```tsx
 * import { AuthForm } from '@picobase_app/react'
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
declare function AuthForm({ mode, providers, redirectTo, onSuccess, onError, className, showForgotPassword, labels: customLabels, }: AuthFormProps): react_jsx_runtime.JSX.Element;

export { AuthForm, type AuthFormProps, PicoBaseProvider, type PicoBaseProviderProps, type UseAuthReturn, type UseCollectionReturn, type UseRealtimeReturn, useAuth, useClient, useCollection, useRealtime };
