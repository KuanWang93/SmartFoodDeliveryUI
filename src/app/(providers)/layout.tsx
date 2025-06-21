// src/app/(providers)/layout.tsx
'use client'

import React from 'react'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { ThemeProvider } from 'next-themes'
import { usePathname } from 'next/navigation'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { store } from '../../store'
import { persistor } from '../../store/persistor'
import { ThemeToggle } from '../../components/ThemeToggle'

export default function ProvidersLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const showToggle = pathname !== '/'

  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
      <ThemeProvider
        attribute="data-theme"
        defaultTheme="light"
        enableSystem={false}
        disableTransitionOnChange
      >
        <Provider store={store}>
          <PersistGate loading={null} persistor={persistor}>
            {/* Only show theme toggle on non-home pages */}
            {showToggle && <ThemeToggle />}
            {children}
          </PersistGate>
        </Provider>
      </ThemeProvider>
    </GoogleOAuthProvider>  
  )
}
