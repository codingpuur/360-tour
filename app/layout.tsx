import type { Metadata } from 'next'
import './globals.css'
import { SessionProvider } from './SessionProvider'

export const metadata: Metadata = {
  title: '360° Tour Platform',
  description: 'Interactive 360° virtual tours',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-950">
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
