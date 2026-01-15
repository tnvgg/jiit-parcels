'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { PickupRequest } from '@/types/database'

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
        const response = await fetch(`/api/my-orders?userId=${user.id}`, {
            cache: 'no-store'
        })
        
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

  function isExpired(createdAt: string) {
    const twoHours = 2 * 60 * 60 * 1000
    const orderTime = new Date(createdAt).getTime()
    const now = Date.now()
    return (now - orderTime) > twoHours
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
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
            <button onClick={() => router.push('/')} className="text-blue-400 hover:text-blue-300 transition">
              ← Back
            </button>
            <h1 className="text-3xl font-bold text-white">Your Activity</h1>
        </div>

        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-blue-400 border-b border-blue-900/50 pb-2 inline-block">
              📤 Created by Me
            </h2>
            <button onClick={() => router.push('/new')} className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition">
              + New
            </button>
          </div>

          {myRequests.length === 0 ? (
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-6 text-center">
              <p className="text-gray-500">No active requests.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {myRequests.map((req) => {
                const expired = isExpired(req.created_at)
                
                return (
                  <div key={req.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 relative overflow-hidden group hover:border-neutral-700 transition">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-white capitalize flex items-center gap-2">
                          {req.order_type}
                          <span className="text-xs font-normal text-gray-500 px-2 py-0.5 bg-neutral-800 rounded-full">
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
                          <p className="text-xs text-gray-500">Accepted by</p>
                          
                          {expired ? (
                            <p className="text-xs text-gray-600 italic mt-1">
                               Details hidden (Old)
                            </p>
                          ) : (
                            <>
                              <p className="text-sm font-medium text-blue-400">{req.accepter.name}</p>
                              {req.accepter.phone && (
                                <a href={`tel:${req.accepter.phone}`} className="text-xs text-green-500 hover:underline">
                                   {req.accepter.phone}
                                </a>
                              )}
                            </>
                          )}
                        </div>
                      ) : (
                         <p className="text-xs text-gray-500 italic">Waiting for acceptor...</p>
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
            Accepted by Me
          </h2>

          {acceptedRequests.length === 0 ? (
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-6 text-center">
              <p className="text-gray-500">You haven't taken any jobs yet.</p>
              <button onClick={() => router.push('/')} className="text-blue-400 text-sm mt-2 hover:underline">Find Work</button>
            </div>
          ) : (
            <div className="grid gap-4">
              {acceptedRequests.map((req) => {
                const expired = isExpired(req.created_at)

                return (
                  <div key={req.id} className="bg-neutral-900 border border-green-900/30 rounded-xl p-5 hover:border-green-800/50 transition">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-white capitalize">{req.order_type}</h3>
                        <p className="text-sm text-gray-400">{req.hostel} • Gate {req.gate_number}</p>
                      </div>
                      <div className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm font-bold shadow-lg shadow-green-900/20">
                        + ₹{req.price}
                      </div>
                    </div>

                    <p className="text-gray-300 text-sm mb-4">{req.details}</p>
                    
                    {req.requester && (
                      <div className="bg-neutral-800/50 rounded-lg p-3 flex justify-between items-center">
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider">Deliver To</p>
                          {expired ? (
                            <p className="text-sm text-gray-500 italic"> Hidden (Expired)</p>
                          ) : (
                            <p className="text-sm font-bold text-white">{req.requester.name}</p>
                          )}
                        </div>
                        
                        {!expired && req.requester.phone ? (
                          <a 
                            href={`tel:${req.requester.phone}`}
                            className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center hover:bg-green-500 transition shadow-lg shadow-green-900/20"
                          >
                            <span className="text-lg">📞</span>
                          </a>
                        ) : (
                          <div className="w-10 h-10 bg-neutral-700 rounded-full flex items-center justify-center cursor-not-allowed opacity-50">
                            <span className="text-sm">🚫</span>
                          </div>
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