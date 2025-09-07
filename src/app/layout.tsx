import type { Metadata } from 'next'
import { Geist, Geist_Mono, Inter, Playfair_Display } from 'next/font/google'
import { AuthProvider } from '@/hooks/useAuth'
import './globals.css'

// Force dynamic rendering to prevent static generation issues with session
export const dynamic = 'force-dynamic'

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
  title: 'Gallery Pavilion - Professional Photography Platform',
  description: 'Professional photography platform for photographers to showcase, share, and sell their work. Create beautiful galleries, manage clients, and grow your photography business.',
  keywords: 'photography, gallery, photographer, portfolio, photo sharing, professional photography, client galleries, photo sales, photography business',
  openGraph: {
    title: 'Gallery Pavilion - Professional Photography Platform',
    description: 'Professional photography platform for photographers to showcase, share, and sell their work with beautiful galleries and client management tools.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${playfair.variable} antialiased`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
