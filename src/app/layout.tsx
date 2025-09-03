import type { Metadata } from 'next'
import { Geist, Geist_Mono, Inter, Playfair_Display } from 'next/font/google'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import SessionProvider from '@/components/SessionProvider'
import SessionErrorHandler from '@/components/SessionErrorHandler'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
})

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
})

const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'PrivateGallery - Exclusive Photogram Art Collection',
  description: 'Curated collection of original photogram artworks. Each piece is a unique, camera-less photograph created through direct light exposure on photographic paper.',
  keywords: 'photogram, photography, art gallery, original artwork, unique prints, contemporary art, photographic art, exclusive collection',
  openGraph: {
    title: 'PrivateGallery - Exclusive Photogram Art Collection',
    description: 'Discover unique photogram artworks - original, camera-less photographs with certificates of authenticity.',
    type: 'website',
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let session = null
  let hasSessionError = false
  
  try {
    session = await getServerSession(authOptions)
  } catch (error) {
    // Handle JWT decryption errors gracefully - likely due to secret change
    console.warn('Session decryption failed, clearing session:', error.message)
    session = null
    hasSessionError = true
  }

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${playfair.variable} antialiased`}
      >
        <SessionProvider session={session}>
          <SessionErrorHandler hasSessionError={hasSessionError} />
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
