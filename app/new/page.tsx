'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProfileGuard } from '@/components/ProfileGuard' 
import { useProfileGuard } from '@/hooks/useProfileGuard'
import FeeSlider from '@/components/FeeSlider'
import { Hostel, OrderType } from '@/types/database'

function NewRequestContent() {
  const { profile } = useProfileGuard() 
  const router = useRouter()

  const [hostel, setHostel] = useState<Hostel>('ABB3')
  const [gateNumber, setGateNumber] = useState('')
  const [orderType, setOrderType] = useState<OrderType>('food')
  const [etaType, setEtaType] = useState<'here' | 'custom'>('here')
  const [customEta, setCustomEta] = useState('')
  const [paid, setPaid] = useState(false)

  const [phone, setPhone] = useState(profile?.phone || '')
  const [notifEmail, setNotifEmail] = useState(profile?.email || '')
  
  const [details, setDetails] = useState('')
  const [price, setPrice] = useState<number>(25)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    
    try {
      const response = await fetch('/api/create-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterId: profile.id, 
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

      if (!response.ok) throw new Error('Failed to create request')
      router.push('/')
    } catch (err: any) {
      setErrorMsg(err.message)
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <button onClick={() => router.push('/')} className="text-blue-400 mb-4">← Back</button>
        <h1 className="text-2xl font-bold text-white">New Pickup Request</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 space-y-6">
        {errorMsg && <div className="p-3 bg-red-900/20 text-red-400 border border-red-800 rounded">{errorMsg}</div>}

        {}
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

        {}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Gate Number</label>
          <select value={gateNumber} onChange={(e) => setGateNumber(e.target.value)} className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 text-white rounded-lg" required>
            <option value="" disabled>Select Gate</option>
            <option value="1">Gate 1</option>
            <option value="2">Gate 2</option>
            <option value="3">Gate 3</option>
          </select>
        </div>

        {}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Order Type</label>
          <div className="flex gap-4 text-white">
            <label><input type="radio" name="orderType" value="food" checked={orderType === 'food'} onChange={(e) => setOrderType(e.target.value as OrderType)} className="mr-2" /> Food</label>
            <label><input type="radio" name="orderType" value="package" checked={orderType === 'package'} onChange={(e) => setOrderType(e.target.value as OrderType)} className="mr-2" /> Package</label>
          </div>
        </div>

        {}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number</label>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 text-white rounded-lg" required placeholder="9876543210" />
        </div>

        {}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Notification Email</label>
          <input type="email" value={notifEmail} onChange={(e) => setNotifEmail(e.target.value)} className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 text-white rounded-lg" required />
        </div>

        {}
        <FeeSlider initialValue={25} onChange={setPrice} />

        <button type="submit" disabled={submitting} className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-800">
          {submitting ? 'Posting...' : 'Post Request'}
        </button>
      </form>
    </div>
  )
}

export default function NewRequestPage() {
  return (
    <ProfileGuard>
      <NewRequestContent />
    </ProfileGuard>
  )
}