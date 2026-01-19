'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js';
import FeeSlider from '@/components/FeeSlider'

// Define types locally to avoid import errors
type Hostel = 'ABB3' | 'Sarojini' | 'H3' | 'H4' | 'H5'
type OrderType = 'food' | 'package'

export default function NewRequestPage() {
  const router = useRouter()
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );

  // Loading State
  const [loading, setLoading] = useState(true)
  const [userSession, setUserSession] = useState<any>(null)

  // Form State
  const [hostel, setHostel] = useState<Hostel>('ABB3')
  const [gateNumber, setGateNumber] = useState('')
  const [orderType, setOrderType] = useState<OrderType>('food')
  const [etaType, setEtaType] = useState<'here' | 'custom'>('here')
  const [customEta, setCustomEta] = useState('')
  const [paid, setPaid] = useState(false)
  
  const [phone, setPhone] = useState('')
  const [notifEmail, setNotifEmail] = useState('')
  
  const [details, setDetails] = useState('')
  const [price, setPrice] = useState<number>(25)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    
    // 1. SAFETY TIMEOUT: Force show page after 4 seconds
    const timer = setTimeout(() => {
      if (isMounted) setLoading(false)
    }, 4000)

    async function loadData() {
      try {
        // 2. Get User
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }
        if (isMounted) setUserSession(user)

        // 3. Get Profile (Best Effort)
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (isMounted && profile) {
          // Pre-fill form
          setHostel(profile.hostel || 'ABB3')
          setPhone(profile.phone || '')
          setNotifEmail(profile.email || user.email || '')
        } else if (isMounted && !profile) {
          // Profile missing? Pre-fill from Auth
          setNotifEmail(user.email || '')
        }

      } catch (err) {
        console.error("Load Error:", err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadData()
    return () => { isMounted = false; clearTimeout(timer) }
  }, [router, supabase])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setErrorMsg(null)
    
    try {
      if (!userSession) throw new Error("Please log in again")

      const response = await fetch('/api/create-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterId: userSession.id, // Use ID from session directly
          hostel,
          gateNumber,
          orderType,
          eta: etaType === 'here' ? 'Already here' : customEta,
          paid,
          details,
          price,
          phone,
          notificationEmail: notifEmail
        })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to create request')
      
      router.push('/')
    } catch (err: any) {
      setErrorMsg(err.message)
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-gray-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
        <p>Preparing form...</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <button onClick={() => router.push('/')} className="text-blue-400 mb-4">← Back</button>
        <h1 className="text-2xl font-bold text-white">New Pickup Request</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 space-y-6">
        {errorMsg && <div className="p-3 bg-red-900/20 text-red-400 border border-red-800 rounded">{errorMsg}</div>}

        {/* HOSTEL */}
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

        {/* GATE */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Gate Number</label>
          <select value={gateNumber} onChange={(e) => setGateNumber(e.target.value)} className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 text-white rounded-lg" required>
            <option value="" disabled>Select Gate</option>
            <option value="1">Gate 1</option>
            <option value="2">Gate 2</option>
            <option value="3">Gate 3</option>
          </select>
        </div>

        {/* TYPE */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Order Type</label>
          <div className="flex gap-4 text-white">
            <label><input type="radio" name="orderType" value="food" checked={orderType === 'food'} onChange={(e) => setOrderType(e.target.value as OrderType)} className="mr-2" /> Food</label>
            <label><input type="radio" name="orderType" value="package" checked={orderType === 'package'} onChange={(e) => setOrderType(e.target.value as OrderType)} className="mr-2" /> Package</label>
          </div>
        </div>

        {/* PHONE */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number</label>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 text-white rounded-lg" required placeholder="9876543210" />
        </div>

        {/* EMAIL */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Notification Email</label>
          <input type="email" value={notifEmail} onChange={(e) => setNotifEmail(e.target.value)} className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 text-white rounded-lg" required />
          <p className="text-xs text-gray-500 mt-1">Use a personal email (Gmail/iCloud) to ensure you receive alerts.</p>
        </div>

        <FeeSlider initialValue={25} onChange={setPrice} />

        <button type="submit" disabled={submitting} className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-800">
          {submitting ? 'Posting...' : 'Post Request'}
        </button>
      </form>
    </div>
  )
}