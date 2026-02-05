import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { getUserByEmail, verifyPassword } from './lib/auth'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await getUserByEmail(credentials.email as string)

        if (!user) {
          return null
        }

        const isValid = await verifyPassword(
          credentials.password as string,
          user.password_hash as string
        )

        if (!isValid) {
          return null
        }

        return {
          id: user.id as string,
          email: user.email as string,
          name: user.name as string || null,
        }
      },
    }),
  ],
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },
})
