import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import ProvidersLayout from './(providers)/layout'
import Script from 'next/script'
import { Toaster } from 'react-hot-toast'


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
      data-theme="light"
      style={{ colorScheme: 'light' }}
    >
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ProvidersLayout>
          {children}
          <Toaster 
          position="top-center"
          toastOptions={{
            style: { padding: '1rem', borderRadius: '0.5rem' },
            success: { icon: '✅' },
            error:   { icon: '⚠️' },
          }}
        />
        </ProvidersLayout>
        {/* 禁用FedCM，防止开发环境Chrome报非https的错误 */}
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="beforeInteractive"
          data-client_id={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}
          data-auto_prompt="false"
          data-fedcm_enabled="false"
        />
      </body>
    </html>
  )
}
