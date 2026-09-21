import type { Metadata, Viewport } from 'next'
import { Space_Grotesk, Inter, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const grotesk = Space_Grotesk({
  variable: '--font-grotesk',
  subsets: ['latin'],
})

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})

const plex = IBM_Plex_Mono({
  variable: '--font-plex',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
})

export const metadata: Metadata = {
  title: {
    default: 'Huffman Lab — Greedy Compression Studio',
    template: '%s · Huffman Lab',
  },
  description:
    'A live study of Huffman coding: encode and decode any text, visualise the tree as it is built, and read a compression-ratio report across real file types.',
  authors: [{ name: 'BCSE204P · Exp 1' }],
}

export const viewport: Viewport = {
  themeColor: '#f5f1e8',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${grotesk.variable} ${inter.variable} ${plex.variable}`}
    >
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}