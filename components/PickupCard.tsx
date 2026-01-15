'use client'

import { useState } from 'react'
import { PickupRequest } from '@/types/database'
import AcceptModal from './AcceptModal'
import ReportModal from './ReportModal'
import ContactInfoModal from './ContactInfoModal'
import DeleteModal from './DeleteModal'
import UpdatePriceModal from './UpdatePriceModal'
import { formatTime } from '@/lib/utils'

interface PickupCardProps {
  request: PickupRequest
  currentUserId: string
  isBanned: boolean
  onUpdate: () => void
}

export default function PickupCard({ request, currentUserId, isBanned, onUpdate }: PickupCardProps) {
  const [showAcceptModal, setShowAcceptModal] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showUpdatePriceModal, setShowUpdatePriceModal] = useState(false)
  
  const isRequester = request.requester_id === currentUserId
  const isAccepter = request.accepted_by === currentUserId
  const isAccepted = request.status === 'accepted'

  return (
    <>
      <div className={`bg-neutral-900 border rounded-lg p-5 transition ${
        isAccepted ? 'border-green-800 shadow-sm' : 'border-neutral-800 hover:border-neutral-700'
      }`}>
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                isAccepted ? 'bg-green-900/30 text-green-400' : 'bg-blue-900/30 text-blue-400'
              }`}>
                {isAccepted ? 'Accepted' : request.hostel}
              </span>
              <span className="px-3 py-1 bg-neutral-800 text-gray-300 rounded-full text-sm">
                Gate {request.gate_number}
              </span>
            </div>
            <p className="text-sm text-gray-500">{formatTime(request.created_at)}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-white">₹{request.price}</p>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-500">Type:</span>
            <span className="capitalize text-sm text-gray-200">{request.order_type}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-500">ETA:</span>
            <span className="text-sm text-gray-200">{request.eta}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-500">Paid:</span>
            <span className={`text-sm font-medium ${request.paid ? 'text-green-400' : 'text-orange-400'}`}>
              {request.paid ? 'Yes' : 'No'}
            </span>
          </div>
          {request.details && (
            <div className="mt-3 pt-3 border-t border-neutral-800">
              <p className="text-sm text-gray-300">{request.details}</p>
            </div>
          )}
        </div>
        
        <div className="flex flex-col gap-2">
          {isRequester && isAccepted && request.accepter && (
            <button
              onClick={() => setShowContactModal(true)}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium text-sm flex items-center justify-center gap-2"
            >
              <span>👤</span> View Accepter Details
            </button>
          )}

          {isAccepter && isAccepted && request.requester && (
            <button
              onClick={() => setShowContactModal(true)}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium text-sm flex items-center justify-center gap-2"
            >
              <span>👤</span> View Requester Details
            </button>
          )}

          {isRequester ? (
            <div className="flex gap-2">
              {!isAccepted && (
                <button
                  onClick={() => setShowUpdatePriceModal(true)}
                  className="flex-1 px-4 py-2 bg-blue-900/30 text-blue-400 border border-blue-900/50 rounded-lg hover:bg-blue-900/40 transition font-medium text-sm"
                >
                  Increase Price
                </button>
              )}
              
              {!isAccepted && (
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="flex-1 px-4 py-2 bg-neutral-800 text-gray-300 border border-neutral-700 rounded-lg hover:bg-neutral-700 transition font-medium text-sm"
                >
                  Delete
                </button>
              )}
              
              {isAccepted && (
                <button
                  onClick={() => setShowReportModal(true)}
                  className="w-full px-4 py-2 bg-red-900/20 text-red-400 border border-red-900/30 rounded-lg hover:bg-red-900/30 transition font-medium text-sm"
                >
                  Report Issue
                </button>
              )}
            </div>
          ) : (
            request.status === 'waiting' && (
              <button
                onClick={() => setShowAcceptModal(true)}
                disabled={isBanned}
                className={`w-full px-4 py-2 rounded-lg font-medium transition ${
                  isBanned
                    ? 'bg-neutral-800 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isBanned ? 'Account Restricted' : 'Accept'}
              </button>
            )
          )}
        </div>
      </div>

      {showAcceptModal && (
        <AcceptModal
          request={request}
          currentUserId={currentUserId}
          onClose={() => setShowAcceptModal(false)}
          onSuccess={onUpdate}
        />
      )}

      {showReportModal && (
        <ReportModal
          requestId={request.id}
          onClose={() => setShowReportModal(false)}
        />
      )}

      {showContactModal && isRequester && request.accepter && (
  <ContactInfoModal
    user={request.accepter}
    role="accepter"
    phone={request.accepter.phone} 
    onClose={() => setShowContactModal(false)}
  />
)}

{showContactModal && isAccepter && request.requester && (
  <ContactInfoModal
    user={request.requester}
    role="requester"
    onClose={() => setShowContactModal(false)}
  />
)}

      {showDeleteModal && (
        <DeleteModal
          requestId={request.id}
          onClose={() => setShowDeleteModal(false)}
          onSuccess={onUpdate}
        />
      )}

      {showUpdatePriceModal && (
        <UpdatePriceModal
          requestId={request.id}
          currentPrice={request.price}
          onClose={() => setShowUpdatePriceModal(false)}
          onSuccess={onUpdate}
        />
      )}
    </>
  )
}