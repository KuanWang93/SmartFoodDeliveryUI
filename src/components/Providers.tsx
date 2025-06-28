'use client'

import dynamic from 'next/dynamic'
import React from 'react'

// 动态加载真正的 Providers，并禁用 SSR
const Providers = dynamic(() => import('./Providers'), { ssr: false })

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return <Providers>{children}</Providers>
}
