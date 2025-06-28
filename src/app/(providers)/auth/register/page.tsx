'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import apiClient from '../../../../services/apiClient'

const roles = ['client', 'merchant', 'rider'] as const

type RegistrationForm = {
  username: string
  email: string
  password: string
  phone: string
  gender: string
  avatar: string         // client/rider 可上传头像
  // merchant字段↓
  address: string
  city: string
  state: string
  country: string
  merchantName: string
  zipcode: string
  merchantDescription: string
  merchantImage: string
  merchantType: string
  merchantSocialMedia: string[]
  merchantOpeningHours: Record<string, string>
}

export default function RegisterPage() {
  const router = useRouter()
  const [role, setRole] = useState<'client' | 'merchant' | 'rider'>('client')
  const [form, setForm] = useState<RegistrationForm>({
    username: '',
    email: '',
    password: '',
    phone: '',
    gender: '',
    avatar: '',
    address: '',
    city: '',
    state: '',
    country: '',
    merchantName: '',
    zipcode: '',
    merchantDescription: '',
    merchantImage: '',
    merchantType: '',
    merchantSocialMedia: [''],
    merchantOpeningHours: {},
  })

  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  // ---- 通用 ----
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }
  // merchant 开放时间
  const updateOpeningHours = (day: string, value: string) => {
    setForm(prev => ({
      ...prev,
      merchantOpeningHours: {
        ...prev.merchantOpeningHours,
        [day]: value
      }
    }))
  }
  // merchant 图片
  const handleMerchantImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const uploadData = new FormData()
      uploadData.append('file', file)
      const res = await apiClient.post('/upload', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const url = res.data?.url || ''
      setForm(prev => ({ ...prev, merchantImage: url }))
    } catch {
      setError('Image upload failed')
    }
    setUploading(false)
  }
  // client/rider 头像
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const uploadData = new FormData()
      uploadData.append('file', file)
      const res = await apiClient.post('/upload', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const url = res.data?.url || ''
      setForm(prev => ({ ...prev, avatar: url }))
    } catch {
      setError('Avatar upload failed')
    }
    setUploading(false)
  }
  // merchant 动态 Social Media
  const handleSocialMediaChange = (idx: number, value: string) => {
    setForm(prev => ({
      ...prev,
      merchantSocialMedia: prev.merchantSocialMedia.map((v, i) => (i === idx ? value : v))
    }))
  }
  const addSocialMedia = () =>
    setForm(prev => ({ ...prev, merchantSocialMedia: [...prev.merchantSocialMedia, ''] }))
  const removeSocialMedia = (idx: number) =>
    setForm(prev => ({
      ...prev,
      merchantSocialMedia: prev.merchantSocialMedia.filter((_, i) => i !== idx)
    }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      if (!form.username || !form.email || !form.password || !form.phone) {
        setError('Please fill in all required fields')
        setSaving(false)
        return
      }
      // 组装payload
      let payload: any = {
        role,
        user: {
          username: form.username,
          email: form.email,
          password: form.password,
          phone: form.phone,
          role,
        },
      }
      if (role === 'merchant') {
        payload = {
          ...payload,
          address: form.address,
          city: form.city,
          state: form.state,
          country: form.country,
          merchantName: form.merchantName,
          zipcode: form.zipcode,
          merchantDescription: form.merchantDescription,
          merchantImage: form.merchantImage,
          merchantType: form.merchantType,
          merchantSocialMedia: form.merchantSocialMedia.filter(Boolean).join(','),
          merchantOpeningHours: form.merchantOpeningHours,
        }
      }
      if (role === 'client' || role === 'rider') {
        payload = {
          ...payload,
          gender: form.gender,
          avatar: form.avatar,
        }
      }

      await apiClient.post('/auth/register', payload)
      alert('Registration successful.')
      router.push(`/auth/login?role=${role}`)
    } catch (err) {
      setError('Registration failed. Please check your input.')
    }
    setSaving(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-white to-pink-100 px-4 py-10">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl p-10">
        <div className="relative flex justify-center items-center mb-4">
          <button
            className="absolute left-0 text-blue-600 hover:underline"
            onClick={() => router.back()}
          >
            ← 返回
          </button>
          <h2 className="text-3xl font-extrabold text-indigo-700 tracking-tight">Register Account</h2>
        </div>
        <div className="flex justify-center gap-4 mb-6">
          {roles.map(r => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`px-4 py-1 rounded-full ${role === r ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* 通用字段 */}
          <div className="space-y-5">
            <div>
              <label className="block font-semibold mb-1">Username <span className="text-red-500">*</span></label>
              <input type="text" name="username" value={form.username} onChange={handleChange} required className="w-full p-3 border rounded-xl" />
            </div>
            <div>
              <label className="block font-semibold mb-1">Email <span className="text-red-500">*</span></label>
              <input type="email" name="email" value={form.email} onChange={handleChange} required className="w-full p-3 border rounded-xl" />
            </div>
            <div>
              <label className="block font-semibold mb-1">Password <span className="text-red-500">*</span></label>
              <input type="password" name="password" value={form.password} onChange={handleChange} required className="w-full p-3 border rounded-xl" />
            </div>
            {/* merchant专属 */}
            {role === 'merchant' && (
              <>
                <div>
                  <label className="block font-semibold mb-1">Merchant Name <span className="text-red-500">*</span></label>
                  <input type="text" name="merchantName" value={form.merchantName} onChange={handleChange} required className="w-full p-3 border rounded-xl" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Address <span className="text-red-500">*</span></label>
                  <input type="text" name="address" value={form.address} onChange={handleChange} required className="w-full p-3 border rounded-xl" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">City <span className="text-red-500">*</span></label>
                  <input type="text" name="city" value={form.city} onChange={handleChange} required className="w-full p-3 border rounded-xl" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">State <span className="text-red-500">*</span></label>
                  <input type="text" name="state" value={form.state} onChange={handleChange} required className="w-full p-3 border rounded-xl" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Country <span className="text-red-500">*</span></label>
                  <input type="text" name="country" value={form.country} onChange={handleChange} required className="w-full p-3 border rounded-xl" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Zip Code</label>
                  <input type="text" name="zipcode" value={form.zipcode} onChange={handleChange} className="w-full p-3 border rounded-xl" />
                </div>
              </>
            )}
          </div>
          {/* 右侧 */}
          <div className="space-y-5">
            <div>
              <label className="block font-semibold mb-1">Phone <span className="text-red-500">*</span></label>
              <input type="text" name="phone" value={form.phone} onChange={handleChange} required className="w-full p-3 border rounded-xl" />
            </div>
            {/* merchant专属 */}
            {role === 'merchant' && (
              <>
                <div>
                  <label className="block font-semibold mb-1">Merchant Type</label>
                  <input type="text" name="merchantType" value={form.merchantType} onChange={handleChange} className="w-full p-3 border rounded-xl" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Merchant Image</label>
                  <input type="file" accept="image/*" onChange={handleMerchantImage} className="w-full p-3 border rounded-xl" />
                  {form.merchantImage && (
                    <img src={form.merchantImage} alt="preview" className="w-24 h-24 mt-2 rounded-xl object-cover" />
                  )}
                  {uploading && <span className="text-gray-500 text-sm">Uploading...</span>}
                </div>
                <div>
                  <label className="block font-semibold mb-1">Description</label>
                  <input type="text" name="merchantDescription" value={form.merchantDescription} onChange={handleChange} className="w-full p-3 border rounded-xl" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Social Media</label>
                  {form.merchantSocialMedia.map((v, idx) => (
                    <div key={idx} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="e.g. Instagram@xxx"
                        value={v}
                        onChange={e => handleSocialMediaChange(idx, e.target.value)}
                        className="flex-1 p-2 border rounded"
                      />
                      <button
                        type="button"
                        onClick={() => removeSocialMedia(idx)}
                        disabled={form.merchantSocialMedia.length <= 1}
                        className="text-red-500 font-bold px-2 rounded hover:bg-red-50"
                      >
                        -
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addSocialMedia}
                    className="mt-1 text-indigo-600 font-bold px-3 rounded hover:bg-indigo-50"
                  >+ Add Social Media</button>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Opening Hours <span className="text-red-500">*</span></label>
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                    <div key={day} className="flex gap-2 items-center my-1">
                      <label className="w-12">{day}</label>
                      <input
                        type="text"
                        placeholder="e.g. 10:00-22:00 or closed"
                        value={form.merchantOpeningHours[day] || ''}
                        onChange={e => updateOpeningHours(day, e.target.value)}
                        className="flex-1 p-2 border rounded"
                      />
                    </div>
                  ))}
                </div>
              </>
            )}
            {/* client/rider专属 */}
            {(role === 'client' || role === 'rider') && (
              <>
                <div>
                  <label className="block font-semibold mb-1">Gender <span className="text-red-500">*</span></label>
                  <select name="gender" value={form.gender} onChange={handleChange} required className="w-full p-3 border rounded-xl">
                    <option value="">Please select</option>
                    <option value="0">Female</option>
                    <option value="1">Male</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Avatar (optional)</label>
                  <input type="file" accept="image/*" onChange={handleAvatarChange} className="w-full p-3 border rounded-xl" />
                  {form.avatar && (
                    <img src={form.avatar} alt="avatar preview" className="w-20 h-20 mt-2 rounded-full object-cover" />
                  )}
                  {uploading && <span className="text-gray-500 text-sm">Uploading...</span>}
                </div>
              </>
            )}
          </div>
          <div className="col-span-1 md:col-span-2">
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold shadow-lg hover:bg-indigo-700 active:scale-95 transition-all"
              disabled={saving}
            >
              {saving ? 'Registering...' : 'Register'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
