'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Hostel, OrderType, Profile } from '@/types/database'
import { useRouter } from 'next/navigation'
import FeeSlider from '@/components/FeeSlider' 

export default function NewRequestPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  
  const [hostel, setHostel] = useState<Hostel>('ABB3')
  const [gateNumber, setGateNumber] = useState('') 
  const [orderType, setOrderType] = useState<OrderType>('food')
  const [etaType, setEtaType] = useState<'here' | 'custom'>('here')
  const [customEta, setCustomEta] = useState('')
  const [paid, setPaid] = useState(false)
  const [phone, setPhone] = useState('')
  const [details, setDetails] = useState('')
  const [price, setPrice] = useState<number>(25)
  
  const [notifEmail, setNotifEmail] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  
  const [errors, setErrors] = useState({
    gate: false,
    phone: false,
    customEta: false,
    email: false 
  })

  useEffect(() => { checkAuth() }, [])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (profileData) {
      setProfile(profileData)
      setHostel(profileData.hostel || 'ABB3')
    }
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!profile || profile.banned) return

    const newErrors = {
      gate: !gateNumber, 
      phone: phone.length !== 10,
      customEta: etaType === 'custom' && !customEta.trim(),
      email: !notifEmail.includes('@') // Basic email check
    }

    if (newErrors.gate || newErrors.phone || newErrors.customEta || newErrors.email) {
      setErrors(newErrors)
      setErrorMsg("Please fix the highlighted fields")
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(200);
      return
    }

    setSubmitting(true)
    setErrorMsg(null)

    const eta = etaType === 'here' ? 'Already here' : customEta

    try {
      const response = await fetch('/api/create-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterId: profile.id,
          hostel,
          gateNumber,
          orderType,
          eta,
          paid,
          details,
          price,
          phone,
          notificationEmail: notifEmail 
        })
      })

      const rawText = await response.text()
      let data
      try { data = JSON.parse(rawText) } catch (e) { throw new Error(`Server Error: ${response.status}`) }

      if (!response.ok) throw new Error(data.error || 'Failed')
      router.push('/')
    } catch (err: any) {
      setErrorMsg(err.message)
      setSubmitting(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen bg-black text-gray-400">Loading...</div>
  if (profile?.banned) return <div className="text-white p-10 text-center">Account Restricted</div>

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <button onClick={() => router.push('/')} className="text-blue-400 mb-4">← Back</button>
        <h1 className="text-2xl font-bold text-white">New Pickup Request</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 space-y-6">
        {errorMsg && <div className="p-3 bg-red-900/20 text-red-400 border border-red-800 rounded">{errorMsg}</div>}

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Hostel</label>
          <select value={hostel} onChange={(e) => setHostel(e.target.value as Hostel)} className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 text-white rounded-lg">
            <option value="ABB3">ABB3</option>
            <option value="Sarojini">Sarojini</option>
            <option value="H3">H3</option>
            <option value="H4">H4</option>
            <option value="H5">H5</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Gate Number</label>
          <select 
            value={gateNumber} 
            onChange={(e) => { 
              setGateNumber(e.target.value); 
              setErrors(prev => ({ ...prev, gate: false }))
            }} 
            className={`w-full px-3 py-2 bg-neutral-800 border text-white rounded-lg focus:outline-none transition-all
              ${errors.gate 
                ? 'border-red-500 ring-1 ring-red-500' 
                : 'border-neutral-700 focus:ring-2 focus:ring-blue-600'
              }`}
            required
          >
            <option value="" disabled>Select Gate</option>
            <option value="1">Gate 1</option>
            <option value="2">Gate 2</option>
            <option value="3">Gate 3</option>
          </select>
          {errors.gate && <p className="text-red-400 text-xs mt-1">⚠️ Please select a gate</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Order Type</label>
          <div className="flex gap-4 text-white">
            <label><input type="radio" name="orderType" value="food" checked={orderType === 'food'} onChange={(e) => setOrderType(e.target.value as OrderType)} className="mr-2" /> Food</label>
            <label><input type="radio" name="orderType" value="package" checked={orderType === 'package'} onChange={(e) => setOrderType(e.target.value as OrderType)} className="mr-2" /> Package</label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">ETA</label>
          <div className="space-y-3 text-white">
            <label className="flex items-center"><input type="radio" name="etaType" value="here" checked={etaType === 'here'} onChange={() => { setEtaType('here'); setErrors(prev => ({...prev, customEta: false})); }} className="mr-2" /> Already here</label>
            <label className="flex items-center"><input type="radio" name="etaType" value="custom" checked={etaType === 'custom'} onChange={() => setEtaType('custom')} className="mr-2" /> Custom</label>
            
            {etaType === 'custom' && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                <input 
                  type="text" 
                  value={customEta} 
                  onChange={(e) => { 
                    setCustomEta(e.target.value); 
                    setErrors(prev => ({ ...prev, customEta: false })) 
                  }} 
                  className={`w-full px-3 py-2 bg-neutral-800 border text-white rounded-lg focus:outline-none transition-all
                    ${errors.customEta 
                      ? 'border-red-500 ring-1 ring-red-500 placeholder-red-400/50' 
                      : 'border-neutral-700 focus:ring-2 focus:ring-blue-600'
                    }`}
                  placeholder="e.g., 10 mins" 
                />
                {errors.customEta && <p className="text-red-400 text-xs mt-1">⚠️ Time is required</p>}
              </div>
            )}
          </div>
        </div>

        <div className="text-white">
          <label><input type="checkbox" checked={paid} onChange={(e) => setPaid(e.target.checked)} className="mr-2" /> Order already paid</label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number *</label>
          <input 
            type="tel" 
            value={phone} 
            onChange={(e) => { 
              const v = e.target.value.replace(/\D/g, ''); 
              if (v.length <= 10) {
                setPhone(v); 
                setErrors(prev => ({ ...prev, phone: false }))
              }
            }} 
            className={`w-full px-3 py-2 bg-neutral-800 border text-white rounded-lg focus:outline-none transition-all
              ${errors.phone 
                ? 'border-red-500 ring-1 ring-red-500' 
                : 'border-neutral-700 focus:ring-2 focus:ring-blue-600'
              }`}
            placeholder="10 digit mobile number"
            required 
          />
          {errors.phone && <p className="text-red-400 text-xs mt-1">⚠️ Enter a valid 10-digit number</p>}
        </div>

        {}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Notification Email *</label>
          <input 
            type="email" 
            value={notifEmail} 
            onChange={(e) => { 
              setNotifEmail(e.target.value); 
              setErrors(prev => ({ ...prev, email: false }))
            }} 
            className={`w-full px-3 py-2 bg-neutral-800 border text-white rounded-lg focus:outline-none transition-all
              ${errors.email 
                ? 'border-red-500 ring-1 ring-red-500 placeholder-red-400' 
                : 'border-neutral-700 focus:ring-2 focus:ring-blue-600'
              }`}
            placeholder="e.g. your.name@gmail.com"
            required 
          />
          <p className="text-xs text-gray-500 mt-1">
             Use a <b>personal email</b> (Gmail/iCloud) to ensure you receive the &quot;Order Accepted&quot; alert. College email may block it.
          </p>
        </div>

        <FeeSlider initialValue={25} onChange={setPrice} />

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Details</label>
          <textarea value={details} onChange={(e) => setDetails(e.target.value)} className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 text-white rounded-lg" rows={3} />
        </div>

        <button type="submit" disabled={submitting} className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-800">
          {submitting ? 'Posting...' : 'Post Request'}
        </button>
      </form>
    </div>
  )
}