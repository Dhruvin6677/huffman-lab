import type { Metadata, Viewport } from 'next'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: {
    default: 'Huffman Lab',
    template: '%s · Huffman Lab',
  },
  description:
    'A live study of Huffman coding: encode and decode any text, visualise the tree as it is built, and read a compression-ratio report across real file types.',
  authors: [{ name: 'BCSE204P · Exp 1' }],
}

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}