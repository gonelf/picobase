import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from './components/auth-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PicoBase - Instant Backend Infrastructure',
  description: 'Multi-tenant backend platform with real-time database, authentication, file storage, and instant APIs. Build faster with ready-to-use backend services.',
  openGraph: {
    title: 'PicoBase - Instant Backend Infrastructure',
    description: 'Multi-tenant backend platform with real-time database, authentication, file storage, and instant APIs.',
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
