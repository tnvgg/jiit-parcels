'use client'

import { useState, useEffect } from 'react'
import { PickupRequest } from '@/types/database'
import { supabase } from '@/lib/supabase' 

interface AcceptModalProps {
  request: PickupRequest
  currentUserId: string
  onClose: () => void
  onSuccess: () => void
}

export default function AcceptModal({ request, currentUserId, onClose, onSuccess }: AcceptModalProps) {
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [loadingProfile, setLoadingProfile] = useState(true)
  
  const [acceptedData, setAcceptedData] = useState<{
    requesterName: string
    requesterPhone: string
  } | null>(null)

  useEffect(() => {
    async function fetchUserPhone() {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('phone')
          .eq('id', currentUserId)
          .single()
        
        if (data?.phone) {
          setPhoneNumber(data.phone)
        }
      } catch (err) {
        console.error('Error fetching phone:', err)
      } finally {
        setLoadingProfile(false)
      }
    }
    fetchUserPhone()
  }, [currentUserId])

  async function handleAccept() {
    if (!phoneNumber || phoneNumber.length !== 10) {
      setError('Please enter a valid 10-digit phone number to accept')
      return
    }

    setAccepting(true)
    setError(null)

    try {
      const response = await fetch('/api/accept-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: request.id,
          accepterId: currentUserId,
          accepterPhone: phoneNumber 
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to accept request')
      }

      setAcceptedData({
        requesterName: data.requesterName || 'Unknown',
        requesterPhone: data.requesterPhone || 'Not provided'
      })
      setSuccess(true)
      
    } catch (err: any) {
      console.error('Accept error:', err)
      setError(err.message || 'Network error. Please try again.')
      setAccepting(false)
    }
  }

  function handleCloseSuccess() {
    onSuccess()
    onClose()
  }

  if (success && acceptedData) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-900/50">
              <span className="text-3xl">🎉</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Request Accepted!</h3>
            <p className="text-sm text-gray-400">Contact the requester immediately</p>
          </div>

          <div className="bg-neutral-800 p-5 rounded-xl border border-neutral-700 mb-6">
             <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Deliver To</p>
             <p className="text-lg font-bold text-white mb-4">{acceptedData.requesterName}</p>
             
             <a 
               href={`tel:${acceptedData.requesterPhone}`} 
               className="flex items-center justify-center gap-2 w-full py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg transition font-bold shadow-lg shadow-green-900/20"
             >
               <span>📞</span> Call {acceptedData.requesterPhone}
             </a>
          </div>

          <button
            onClick={handleCloseSuccess}
            className="w-full px-4 py-3 bg-neutral-800 text-gray-300 border border-neutral-700 rounded-lg hover:bg-neutral-700 transition font-medium"
          >
            Close & Refresh
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg max-w-md w-full p-6 shadow-2xl">
        <h3 className="text-xl font-bold text-white mb-4">Accept Pickup Request?</h3>
        
        {}
        <div className="bg-neutral-800/50 p-4 rounded-lg mb-6 space-y-3 border border-neutral-700/50">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Hostel</span>
            <span className="text-white font-medium">{request.hostel}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Gate</span>
            <span className="text-white font-medium">{request.gate_number}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Item</span>
            <span className="text-white font-medium capitalize">{request.order_type}</span>
          </div>
          <div className="pt-2 border-t border-neutral-700 flex justify-between items-center mt-2">
            <span className="text-gray-400 text-sm">You Earn</span>
            <span className="text-green-400 font-bold text-lg">₹{request.price}</span>
          </div>
        </div>

        {}
        <div className="mb-6">
          <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
            Confirm Your Phone Number <span className="text-red-500">*</span>
          </label>
          
          {loadingProfile ? (
            <div className="h-10 w-full bg-neutral-800 animate-pulse rounded-lg"></div>
          ) : (
            <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500 text-sm">+91</span>
                <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => {
                    setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))
                    if (error) setError(null)
                    }}
                    placeholder="Enter 10-digit number"
                    className="w-full bg-black border border-neutral-700 text-white pl-10 pr-4 py-2.5 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition placeholder-gray-700"
                    maxLength={10}
                    autoFocus={!phoneNumber} 
                />
            </div>
          )}
          <p className="text-[10px] text-gray-500 mt-2 leading-relaxed">
            Required so the requester can call you. We will save this for next time.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-800/50 rounded-lg flex items-start gap-2">
            <span className="text-red-500 mt-0.5">⚠️</span>
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={accepting}
            className="flex-1 px-4 py-2.5 border border-neutral-700 text-gray-300 rounded-lg hover:bg-neutral-800 transition font-medium disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleAccept}
            disabled={accepting || loadingProfile || !phoneNumber || phoneNumber.length !== 10}
            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition font-bold disabled:bg-neutral-800 disabled:text-gray-500 disabled:cursor-not-allowed shadow-lg shadow-blue-900/20"
          >
            {accepting ? 'Processing...' : 'Confirm & Accept'}
          </button>
        </div>
      </div>
    </div>
  )
}