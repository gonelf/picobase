import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from './components/auth-provider'
import { Analytics } from '@vercel/analytics/react'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://picobase.app'),
  title: {
    default: 'PicoBase - The Open Source Backend for Vibe Coders',
    template: '%s | PicoBase',
  },
  description: 'The backend for flow state. Stop managing migrations. Start vibing. Multi-tenant backend platform with real-time database, authentication, file storage, and instant APIs.',
  keywords: ['backend', 'database', 'realtime', 'authentication', 'storage', 'open source', 'firebase alternative', 'supabase alternative', 'pocketbase', 'vibe coding', 'ai backend', 'cursor', 'windsurf', 'v0'],
  authors: [{ name: 'PicoBase Team' }],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'PicoBase - The Open Source Backend for Vibe Coders',
    description: 'The backend for flow state. Stop managing migrations. Start vibing.',
    url: 'https://picobase.app',
    siteName: 'PicoBase',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PicoBase - The Open Source Backend for Vibe Coders',
    description: 'The backend for flow state. Stop managing migrations. Start vibing.',
    creator: '@picobase',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>{children}</AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
