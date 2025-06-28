'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import apiClient from '../../../../services/apiClient'

export default function ClientProfilePage() {
  const router = useRouter()
  const [form, setForm] = useState({
    username: '',
    email: '',
    phone: '',
    gender: '',
    avatar: '',
    createTime: '',
    updateTime: '',
  })
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await apiClient.get('/profile')
        const data = res.data.data
        if (!data || !data.client) throw new Error('Missing profile data')

        setForm({
          username: data.username || '',
          email: data.email || '',
          phone: data.client.phone || '',
          gender: data.client.gender || '',
          avatar: data.client.avatar || '',
          createTime: data.createTime ? formatDate(data.createTime) : '',
          updateTime: data.updateTime ? formatDate(data.updateTime) : '',
        })
      } catch (err) {
        setError('Failed to load profile')
      }
    }
    fetchProfile()
  }, [])

  // 时间格式化 yyyy-MM-dd HH:mm
  function formatDate(timeStr: string) {
    if (!timeStr) return ''
    const date = new Date(timeStr)
    return `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2,'0')}-${date.getDate().toString().padStart(2,'0')} ${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}`
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  // 处理头像上传
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await apiClient.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      const url = res.data.url
      setForm(prev => ({ ...prev, avatar: url }))
    } catch {
      setError('Upload failed')
    }
    setUploading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const payload = {
        phone: form.phone,
        gender: form.gender,
        avatar: form.avatar
      }
      await apiClient.put('/profile', payload)
      alert('Profile updated successfully')
      router.push('/dashboard')
    } catch {
      setError('Update failed. Please check the input.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-white to-pink-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-xl p-10">
        <h2 className="text-3xl font-extrabold text-indigo-700 mb-2 text-center tracking-tight">My Profile</h2>
        <p className="text-center text-gray-500 mb-8">View and update your account information</p>
        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex flex-col items-center md:items-start gap-6">
            <div className="flex flex-col items-center gap-2">
              <div className="relative group">
                {form.avatar ? (
                  <img src={form.avatar} alt="avatar preview" className="w-28 h-28 rounded-full object-cover border-4 border-indigo-100 shadow-lg transition-all" />
                ) : (
                  <div className="w-28 h-28 rounded-full bg-gray-200 flex items-center justify-center text-3xl text-gray-400">?</div>
                )}
                <label className="absolute bottom-1 right-0 bg-indigo-600 text-white px-3 py-1 text-xs rounded-full shadow cursor-pointer opacity-90 hover:opacity-100 transition-opacity">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    disabled={uploading}
                    className="hidden"
                  />
                  {uploading ? 'Uploading...' : 'Change'}
                </label>
              </div>
              <div className="text-gray-500 text-xs">PNG/JPG up to 2MB</div>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block font-semibold mb-1">Username <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="username"
                value={form.username}
                disabled
                className="w-full p-3 border rounded-xl bg-gray-100 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Email <span className="text-red-500">*</span></label>
              <input
                type="email"
                name="email"
                value={form.email}
                disabled
                className="w-full p-3 border rounded-xl bg-gray-100 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Phone <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                required
                className="w-full p-3 border rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Gender <span className="text-red-500">*</span></label>
              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                required
                className="w-full p-3 border rounded-xl"
              >
                <option value="">Please select</option>
                <option value="0">Female</option>
                <option value="1">Male</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">Created At</label>
              <input
                type="text"
                value={form.createTime}
                disabled
                className="w-full p-3 border rounded-xl bg-gray-100 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Updated At</label>
              <input
                type="text"
                value={form.updateTime}
                disabled
                className="w-full p-3 border rounded-xl bg-gray-100 cursor-not-allowed"
              />
            </div>

            <button
              type="submit"
              className="w-full mt-4 bg-indigo-600 text-white py-3 rounded-xl font-semibold shadow-lg hover:bg-indigo-700 active:scale-95 transition-all"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
