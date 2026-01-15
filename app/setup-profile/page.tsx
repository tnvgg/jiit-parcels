'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Hostel } from '@/types/database'
import { Loader2 } from 'lucide-react'

export default function SetupProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  
  const [phone, setPhone] = useState('')
  const [hostel, setHostel] = useState<Hostel>('ABB3')
  const [gender, setGender] = useState('')

  useEffect(() => { checkAuth() }, [])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: profile } = await supabase.from('profiles').select('phone_encrypted, hostel').eq('id', user.id).single()
    if (profile?.phone_encrypted && profile?.hostel) {
      router.push('/')
      return
    }
    setUserId(user.id)
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!userId) return
    setSubmitting(true)

    try {
      const response = await fetch('/api/setup-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, phone, hostel, gender: gender || null })
      })
      if (!response.ok) throw new Error('Failed')
      router.push('/')
    } catch (err) {
      console.error(err)
      setSubmitting(false)
    }
  }

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 to-black flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-neutral-900 rounded-2xl border border-neutral-800 p-8">
        <h1 className="text-2xl font-bold text-white mb-6">Complete Profile</h1>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Phone *</label>
            <input type="tel" value={phone} onChange={(e) => { const v = e.target.value.replace(/\D/g, ''); if (v.length <= 10) setPhone(v) }} className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 text-white rounded-lg" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Hostel *</label>
            <select value={hostel} onChange={(e) => setHostel(e.target.value as Hostel)} className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 text-white rounded-lg">
              <option value="ABB3">ABB3</option>
              <option value="Sarojini">Sarojini</option>
              <option value="H4">H4</option>
              <option value="H5">H5</option>
            </select>
          </div>
          <button type="submit" disabled={submitting} className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-800">
            {submitting ? 'Saving...' : 'Complete Setup'}
          </button>
        </form>
      </div>
    </div>
  )
}