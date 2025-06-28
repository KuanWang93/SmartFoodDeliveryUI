'use client'

import React, { useState, useEffect } from 'react'
import { useAppSelector } from '../../../../store/hooks'
import { selectUser } from '../../../../store/slices/authSlice'
import { ImageOff, Bell, Settings } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ClientDashboardPage() {
  const user = useAppSelector(selectUser)
  const [activeTab, setActiveTab] = useState<'hot' | 'browse' | 'cart' | 'orders' | 'profile'>('hot')
  const router = useRouter()

  useEffect(() => {
    if (!user.accessToken) {
      router.push('/auth/login?role=client')
    }
  }, [user, router])

  const renderContent = () => {
    switch (activeTab) {
      case 'hot': return <div className="p-4">🔥 Hot Deals content</div>
      case 'browse': return <div className="p-4">🔍 Browse Merchants content</div>
      case 'cart': return <div className="p-4">🛒 Shopping Cart content</div>
      case 'orders': return <div className="p-4">📦 My Orders content</div>
      case 'profile': return <div className="p-4">👤 Profile content with pre-filled data</div>
      default: return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="flex items-center justify-between p-4 bg-white shadow">
        <div className="flex items-center space-x-4">
          {user.image ? (
            <img src={user.image} alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
              <ImageOff className="w-5 h-5 text-white" />
            </div>
          )}
          <span className="font-semibold text-gray-800">{user.username}</span>
        </div>
        <div className="flex space-x-4">
          <button><Bell className="w-5 h-5 text-gray-600" /></button>
          <button><Settings className="w-5 h-5 text-gray-600" /></button>
        </div>
      </header>

      <nav className="flex justify-around bg-white shadow-sm py-2 sticky top-0 z-10">
        <button onClick={() => setActiveTab('hot')} className={activeTab === 'hot' ? 'text-indigo-600 font-semibold' : 'text-gray-600'}>Hot</button>
        <button onClick={() => setActiveTab('browse')} className={activeTab === 'browse' ? 'text-indigo-600 font-semibold' : 'text-gray-600'}>Browse</button>
        <button onClick={() => setActiveTab('cart')} className={activeTab === 'cart' ? 'text-indigo-600 font-semibold' : 'text-gray-600'}>Cart</button>
        <button onClick={() => setActiveTab('orders')} className={activeTab === 'orders' ? 'text-indigo-600 font-semibold' : 'text-gray-600'}>Orders</button>
        <button onClick={() => setActiveTab('profile')} className={activeTab === 'profile' ? 'text-indigo-600 font-semibold' : 'text-gray-600'}>Profile</button>
      </nav>

      <main>
        {renderContent()}
      </main>
    </div>
  )
}
