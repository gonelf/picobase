import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { getUserByEmail, verifyPassword, syncUser } from './auth'

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'email', placeholder: 'you@example.com' },
                password: { label: 'Password', type: 'password' }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error('Please enter your email and password')
                }

                const user = await getUserByEmail(credentials.email)

                if (!user) {
                    throw new Error('No user found with this email')
                }

                const isValid = await verifyPassword(credentials.password, user.password_hash as string)

                if (!isValid) {
                    throw new Error('Invalid password')
                }

                return {
                    id: user.id as string,
                    email: user.email as string,
                    name: user.name as string || null,
                }
            }
        })
    ],
    pages: {
        signIn: '/auth-nextauth/signin',
        error: '/auth-nextauth/signin',
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
                token.email = user.email
                token.name = user.name
            }
            return token
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string
                session.user.email = token.email as string
                session.user.name = token.name as string || null

                // Sync user to local DB to satisfy foreign key constraints
                await syncUser(token.id as string, token.email as string, token.name as string)
            }
            return session
        }
    },
    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    cookies: {
        sessionToken: {
            name: process.env.NODE_ENV === 'production'
                ? '__Secure-next-auth.session-token'
                : 'next-auth.session-token',
            options: {
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                secure: process.env.NODE_ENV === 'production',
                domain: process.env.NODE_ENV === 'production'
                    ? `.${process.env.PLATFORM_DOMAIN}`
                    : undefined,
            },
        },
        callbackUrl: {
            name: process.env.NODE_ENV === 'production'
                ? '__Secure-next-auth.callback-url'
                : 'next-auth.callback-url',
            options: {
                sameSite: 'lax',
                path: '/',
                secure: process.env.NODE_ENV === 'production',
            },
        },
        csrfToken: {
            name: process.env.NODE_ENV === 'production'
                ? '__Host-next-auth.csrf-token'
                : 'next-auth.csrf-token',
            options: {
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                secure: process.env.NODE_ENV === 'production',
            },
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
}

export default NextAuth(authOptions)
