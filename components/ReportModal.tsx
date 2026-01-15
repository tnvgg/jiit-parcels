'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface ReportModalProps {
  requestId: string
  onClose: () => void
}

export default function ReportModal({ requestId, onClose }: ReportModalProps) {
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!reason.trim()) return

    setSubmitting(true)
    setError(null)

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        setError('You must be logged in to report')
        setSubmitting(false)
        return
      }

      const { data: requestData, error: fetchError } = await supabase
        .from('pickup_requests')
        .select('accepted_by, status')
        .eq('id', requestId)
        .single()

      if (fetchError || !requestData) {
        setError('Failed to fetch request details')
        setSubmitting(false)
        return
      }

      if (!requestData.accepted_by) {
        setError('This request has not been accepted yet')
        setSubmitting(false)
        return
      }

      const { error: insertError } = await supabase
        .from('reports')
        .insert({
          request_id: requestId,
          reporter_id: user.id,
          reported_user_id: requestData.accepted_by,
          reason: reason.trim(),
        })

      if (insertError) {
        setError(`Failed to submit report: ${insertError.message}`)
        setSubmitting(false)
        return
      }

      setSuccess(true)
      setTimeout(() => {
        onClose()
      }, 2000)
    } catch (err: any) {
      setError(`An unexpected error occurred: ${err.message}`)
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg max-w-md w-full p-6 text-center">
          <div className="w-16 h-16 bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Report Submitted</h3>
          <p className="text-sm text-gray-400">Admin will review this report</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg max-w-md w-full p-6">
        <h3 className="text-xl font-bold text-white mb-4">Report No Pickup</h3>
        
        {error && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded-lg">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Reason for report
            </label>
            {}
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 placeholder-gray-500"
              rows={4}
              placeholder="Describe what happened..."
              required
              disabled={submitting}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-4 py-2 border border-neutral-700 text-gray-300 rounded-lg hover:bg-neutral-800 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !reason.trim()}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:bg-red-800 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}