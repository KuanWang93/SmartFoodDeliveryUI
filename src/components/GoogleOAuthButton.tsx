// src/components/GoogleOAuthButton.tsx
'use client'
import React from 'react'
import { useTheme } from 'next-themes'

export function GoogleOAuthButton({ onClick }: { onClick: () => void }) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const iconSrc = isDark
    ? '/google-icon-dark.svg'
    : '/google-icon-light.svg'

  // 根据主题动态计算样式
  const bgColor    = isDark ? '#1a202c' : '#ffffff'   // 深灰 / 白
  const textColor  = isDark ? '#ffffff' : '#1a202c'   // 白 / 深灰
  const borderColor= isDark ? '#4a5568' : '#d1d5db'   // 暗灰 / 浅灰
  const hoverBg    = isDark ? '#2d3748' : '#f3f4f6'   // 更暗 / 更亮

  return (
    <button
      onClick={onClick}
      style={{
        backgroundColor: bgColor,
        color:           textColor,
        border:          `1px solid ${borderColor}`,
      }}
      className="
        flex items-center px-4 py-2 rounded-lg shadow-sm transition
        hover:opacity-90
      "
      onMouseEnter={e => (e.currentTarget.style.backgroundColor = hoverBg)}
      onMouseLeave={e => (e.currentTarget.style.backgroundColor = bgColor)}
    >
      <img src={iconSrc} alt="Google logo" className="w-6 h-6 mr-2" />
      Continue with Google
    </button>
  )
}
