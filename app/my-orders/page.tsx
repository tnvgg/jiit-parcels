'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { PickupRequest } from '@/types/database'

const SAFETY_TIMEOUT = 2 * 60 * 60 * 1000 

export default function MyOrdersPage() {
  const router = useRouter()
  const [requests, setRequests] = useState<PickupRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    async function loadOrders() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }
        setUserId(user.id)

        // IMPORTANT: Added cache: 'no-store' to stop Next.js from caching empty results
        const response = await fetch(`/api/my-orders?userId=${user.id}`, {
            cache: 'no-store',
            headers: {
                'Cache-Control': 'no-cache'
            }
        })
        
        // Handle 401 Unauthorized by redirecting to login
        if (response.status === 401) {
            router.push('/login')
            return
        }

        const data = await response.json()

        if (data.orders) {
          setRequests(data.orders)
        }
      } catch (error) {
        console.error('Failed to load orders:', error)
      } finally {
        setLoading(false)
      }
    }
    loadOrders()
  }, [router])

  // ... (keep the rest of your file exactly as is, starting from isExpired function) ...
  function isExpired(createdAt: string) {
    const orderTime = new Date(createdAt).getTime()
    const now = Date.now()
    return (now - orderTime) > SAFETY_TIMEOUT
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your activity...</p>
        </div>
      </div>
    )
  }

  const myRequests = requests
    .filter(r => r.requester_id === userId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const acceptedRequests = requests
    .filter(r => r.accepted_by === userId)
    .sort((a, b) => b.price - a.price)

  return (
    <div className="min-h-screen bg-black py-8 px-4 pb-24">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
            <button onClick={() => router.push('/')} className="text-blue-400 hover:text-blue-300 transition flex items-center gap-1">
              <span>←</span> Back
            </button>
            <h1 className="text-3xl font-bold text-white">Your Activity</h1>
        </div>

        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-blue-400 border-b border-blue-900/50 pb-2 inline-block">
              📤 Created by Me
            </h2>
            <button onClick={() => router.push('/new')} className="text-sm bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition font-medium">
              + New Request
            </button>
          </div>

          {myRequests.length === 0 ? (
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-8 text-center">
              <p className="text-gray-500">You haven't requested anything yet.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {myRequests.map((req) => {
                const expired = isExpired(req.created_at)
                
                return (
                  <div key={req.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 relative overflow-hidden">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-white capitalize flex items-center gap-2">
                          {req.order_type}
                          <span className="text-xs font-normal text-gray-500 px-2 py-0.5 bg-neutral-800 rounded-full border border-neutral-700">
                            Gate {req.gate_number}
                          </span>
                        </h3>
                        <p className="text-sm text-gray-400 mt-1">{req.hostel}</p>
                      </div>
                      <div className="text-right">
                         <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          req.status === 'accepted' 
                            ? 'bg-green-900/20 text-green-400 border border-green-900/30' 
                            : 'bg-yellow-900/20 text-yellow-400 border border-yellow-900/30'
                        }`}>
                          {req.status}
                        </span>
                      </div>
                    </div>

                    <p className="text-gray-300 text-sm mb-4 line-clamp-2">{req.details}</p>

                    <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
                      <span className="text-xl font-bold text-white">₹{req.price}</span>
                      
                      {req.status === 'accepted' && req.accepter ? (
                        <div className="text-right">
                          <p className="text-xs text-gray-500 mb-1">Accepted by</p>
                          
                          {expired ? (
                            <div className="flex items-center gap-1.5 text-gray-600 bg-neutral-800 px-2 py-1 rounded border border-neutral-700/50">
                                <span>🔒</span>
                                <span className="text-xs italic">Details Hidden</span>
                            </div>
                          ) : (
                            <div>
                                <p className="text-sm font-medium text-blue-400">{req.accepter.name}</p>
                                {req.accepter.phone && (
                                  <a href={`tel:${req.accepter.phone}`} className="text-xs text-green-500 hover:text-green-400 hover:underline flex items-center justify-end gap-1 mt-0.5">
                                     <span>📞</span> {req.accepter.phone}
                                  </a>
                                )}
                            </div>
                          )}
                        </div>
                      ) : (
                         <p className="text-xs text-gray-500 italic">Waiting for someone...</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-xl font-bold text-green-400 border-b border-green-900/50 pb-2 mb-4 inline-block">
            📥 Accepted by Me
          </h2>

          {acceptedRequests.length === 0 ? (
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-8 text-center">
              <p className="text-gray-500">You haven't taken any jobs yet.</p>
              <button onClick={() => router.push('/')} className="text-blue-400 text-sm mt-3 hover:text-blue-300 font-medium">Browse Requests →</button>
            </div>
          ) : (
            <div className="grid gap-4">
              {acceptedRequests.map((req) => {
                const expired = isExpired(req.created_at)

                return (
                  <div key={req.id} className="bg-neutral-900 border border-green-900/20 rounded-xl p-5 hover:border-green-900/40 transition">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-white capitalize">{req.order_type}</h3>
                        <p className="text-sm text-gray-400">{req.hostel} • Gate {req.gate_number}</p>
                      </div>
                      <div className="bg-green-600/10 text-green-400 border border-green-600/20 px-3 py-1 rounded-lg text-sm font-bold">
                        + ₹{req.price}
                      </div>
                    </div>

                    <p className="text-gray-300 text-sm mb-4 bg-neutral-800/30 p-3 rounded-lg border border-neutral-800">{req.details}</p>
                    
                    {req.requester && (
                      <div className="flex justify-between items-center mt-2">
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Deliver To</p>
                          {expired ? (
                             <span className="text-sm font-medium text-gray-600 italic">Student (Archived)</span>
                          ) : (
                             <p className="text-sm font-bold text-white">{req.requester.name}</p>
                          )}
                        </div>
                        
                        {expired ? (
                          <div className="w-10 h-10 bg-neutral-800 rounded-full flex items-center justify-center border border-neutral-700 cursor-not-allowed" title="Contact info hidden for safety">
                            <span className="text-gray-600 text-lg">🔒</span>
                          </div>
                        ) : (
                          req.requester.phone ? (
                            <a 
                              href={`tel:${req.requester.phone}`}
                              className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center hover:bg-green-500 transition shadow-lg shadow-green-900/20 active:scale-95"
                              title="Call Student"
                            >
                              <span className="text-xl">📞</span>
                            </a>
                          ) : (
                             <div className="w-10 h-10 bg-neutral-700 rounded-full flex items-center justify-center opacity-50 cursor-not-allowed">
                               <span className="text-sm">🚫</span>
                             </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}