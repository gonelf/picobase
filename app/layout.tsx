import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { SuperTokensProvider } from './components/supertokens-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PicoBase - Multi-tenant BaaS Platform',
  description: 'Your own Supabase alternative with PocketBase instances',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SuperTokensProvider>{children}</SuperTokensProvider>
      </body>
    </html>
  )
}
