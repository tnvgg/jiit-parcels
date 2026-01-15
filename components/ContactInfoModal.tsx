'use client'

import { Profile } from '@/types/database'

interface ContactInfoModalProps {
  user: Profile
  role: 'requester' | 'accepter'
  phone?: string
  onClose: () => void
}

export default function ContactInfoModal({ user, role, phone, onClose }: ContactInfoModalProps) {
  const displayPhone = phone || user.phone_encrypted || 'Not provided'
  
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold text-white">
            {role === 'requester' ? 'Requester' : 'Accepter'} Details
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-5 space-y-4">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Name</p>
            <p className="text-lg font-bold text-white">{user.name || 'Unknown'}</p>
          </div>

          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Email</p>
            <p className="text-sm text-gray-300">{user.email}</p>
          </div>

          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Phone Number</p>
            {displayPhone && displayPhone !== 'Not provided' ? (
              <a 
                href={`tel:+91${displayPhone}`}
                className="flex items-center gap-3 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
              >
                <span className="text-2xl">📞</span>
                <div>
                  <span className="text-xs text-blue-200 block">Tap to Call</span>
                  <span className="text-xl font-bold tracking-wide">{displayPhone}</span>
                </div>
              </a>
            ) : (
              <div className="p-3 bg-orange-900/20 border border-orange-800 rounded-lg">
                <p className="text-sm text-orange-400">⚠️ Phone number not available</p>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 px-4 py-2 bg-neutral-700 text-white rounded-lg hover:bg-neutral-600 transition font-medium"
        >
          Close
        </button>
      </div>
    </div>
  )
}