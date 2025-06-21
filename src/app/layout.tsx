// src/app/layout.tsx
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import ProvidersLayout from './(providers)/layout'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SmartFood Delivery',
  description: 'Your taste, delivered',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      // use data-theme instead of className for tw-colors
      data-theme="light"
      style={{ colorScheme: 'light' }}
    >
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ProvidersLayout>
          {children}
        </ProvidersLayout>
      </body>
    </html>
  )
}
