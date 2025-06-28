// src/app/page.tsx
import React from 'react'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div
      className="min-h-screen bg-cover bg-center relative"
      style={{ backgroundImage: "url('/images/hero-bg.png')" }}
      /* style={{ backgroundImage: "url('https://source.unsplash.com/1600x900/?food,restaurant')" }} */
    >
      {/* Semi-transparent overlay */}
      <div className="absolute inset-0 bg-black opacity-50"></div>

      {/* Main content centered */}
      <div className="relative z-10 flex flex-col items-center justify-center h-screen text-center px-6">
      <h1
        className="text-5xl md:text-6xl font-extrabold mb-4 gradient-text"
        style={{
          backgroundImage:
            'linear-gradient(90deg, red, orange, yellow, green, blue, indigo, violet)',
          backgroundSize: '300% auto',       // 300% 让渐变更拉长
          animation: 'textGradient 8s linear infinite',  // 8s 周期更缓慢
          textShadow:
            '2px 2px 0 rgba(0,0,0,0.3), 4px 4px 0 rgba(0,0,0,0.2), 6px 6px 0 rgba(0,0,0,0.1)',
        }}
      >
          Welcome to SmartFoodDelivery
        </h1>
        <p className="text-lg md:text-2xl text-black [text-shadow:1px_1px_2px_rgba(0,0,0,0.7)] mb-8 max-w-xl">
          Explore the tastiest restaurants nearby and savor life's little delights.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/auth/login"
            className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xl font-semibold rounded-full shadow-lg transition transform hover:scale-105 hover:animate-bounce"
          >
            Login
          </Link>
          <Link
            href="/auth/register"
            className="px-8 py-4 bg-white hover:bg-gray-100 text-indigo-600 text-xl font-semibold rounded-full shadow-lg transition transform hover:scale-105 hover:animate-bounce"
          >
            Register
          </Link>
        </div>
      </div>
    </div>
  )
}
