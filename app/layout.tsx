import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from './components/auth-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://picobase.xyz'),
  title: {
    default: 'PicoBase - Instant Backend Infrastructure',
    template: '%s | PicoBase',
  },
  description: 'Multi-tenant backend platform with real-time database, authentication, file storage, and instant APIs. The open source Firebase alternative for vibe coders.',
  keywords: ['backend', 'database', 'realtime', 'authentication', 'storage', 'open source', 'firebase alternative', 'supabase alternative', 'pocketbase'],
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
    title: 'PicoBase - Instant Backend Infrastructure',
    description: 'Multi-tenant backend platform with real-time database, authentication, file storage, and instant APIs. The open source Firebase alternative.',
    url: 'https://picobase.xyz',
    siteName: 'PicoBase',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'PicoBase Preview',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PicoBase - Instant Backend Infrastructure',
    description: 'Multi-tenant backend platform with real-time database, authentication, file storage, and instant APIs.',
    images: ['/og-image.png'],
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
      </body>
    </html>
  )
}
