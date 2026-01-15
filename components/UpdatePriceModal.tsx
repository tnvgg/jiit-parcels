'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface UpdatePriceModalProps {
  requestId: string
  currentPrice: number
  onClose: () => void
  onSuccess: () => void
}

export default function UpdatePriceModal({ requestId, currentPrice, onClose, onSuccess }: UpdatePriceModalProps) {
  const [price, setPrice] = useState(currentPrice + 10)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleUpdate() {
    if (price <= currentPrice) {
      setError(`Price must be higher than ₹${currentPrice}`)
      return
    }

    setLoading(true)
    setError('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        setError('Not authenticated')
        return
      }

      const res = await fetch('/api/update-price', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ requestId, newPrice: price })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to update price')
        return
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 rounded-lg max-w-md w-full p-6 border border-neutral-800">
        <h2 className="text-xl font-bold text-white mb-2">Increase Price</h2>
        <p className="text-sm text-gray-400 mb-4">
          You can only increase the price, not decrease it.
        </p>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-400 mb-2">
            New Price (₹)
          </label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            min={currentPrice + 1}
            max="1000"
            step="5"
            className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-2">
            Current price: <span className="font-semibold text-white">₹{currentPrice}</span>
          </p>
          <p className="text-xs text-blue-400 mt-1">
            Minimum new price: ₹{currentPrice + 1}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-900/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-neutral-800 text-gray-300 rounded-lg hover:bg-neutral-700 transition"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            disabled={loading || price <= currentPrice}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Updating...' : 'Increase Price'}
          </button>
        </div>
      </div>
    </div>
  )
}