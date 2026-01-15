'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface DeleteModalProps {
  requestId: string
  onClose: () => void
  onSuccess: () => void
}

export default function DeleteModal({ requestId, onClose, onSuccess }: DeleteModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleDelete() {
    setLoading(true)
    setError('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        setError('Not authenticated. Please log in again.')
        return
      }

      const res = await fetch('/api/delete-request', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ requestId })
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        setError(data?.error || 'Failed to delete request')
        return
      }

      onSuccess()
      onClose()
      
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-neutral-900 rounded-lg max-w-md w-full p-6 border border-neutral-800 shadow-xl">
        <h2 className="text-xl font-bold text-white mb-4">Delete Request?</h2>
        
        <p className="text-gray-300 mb-6">
          Are you sure you want to delete this request? This action cannot be undone.
        </p>

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
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Deleting...
              </span>
            ) : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}