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
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadOrders() {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError || !session?.user) {
          console.error('Session error:', sessionError)
          router.push('/login')
          return
        }
        
        const user = session.user
        setUserId(user.id)
        
        console.log('🔍 Fetching orders for user:', user.id)

        const response = await fetch(`/api/my-orders?t=${Date.now()}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        })
        
        console.log('📡 Response status:', response.status)
        
        if (!response.ok) {
          if (response.status === 401) {
            console.error('Unauthorized - redirecting to login')
            router.push('/login')
            return
          }
          const errorText = await response.text()
          throw new Error(`Server error: ${response.status} - ${errorText}`)
        }

        const data = await response.json()
        
        if (data.error) {
          throw new Error(data.error)
        }
        
        console.log('✅ Received orders:', data.orders?.length || 0)
        
        if (data.orders) {
          setRequests(data.orders)
        }

      } catch (err: any) {
        console.error('❌ Failed to load orders:', err)
        setError(err.message || 'Failed to load orders')
      } finally {
        setLoading(false)
      }
    }
    
    loadOrders()
  }, [router])

  function isExpired(createdAt: string) {
    const orderTime = new Date(createdAt).getTime()
    const now = Date.now()
    return (now - orderTime) > SAFETY_TIMEOUT
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <div className="text-center max-w-md">
          <p className="text-red-500 mb-2">Error loading activity</p>
          <p className="text-gray-400 text-sm mb-4">{error}</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg"
          >
            Retry
          </button>
          <button 
            onClick={() => router.push('/')} 
            className="bg-neutral-700 hover:bg-neutral-600 text-white px-6 py-2 rounded-lg"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  const myRequests = requests
    .filter(r => r.requester_id === userId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const acceptedRequests = requests
    .filter(r => r.accepted_by === userId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return (
    <div className="min-h-screen bg-black py-8 px-4 pb-24">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => router.push('/')} 
            className="text-blue-400 hover:text-blue-300 transition flex items-center gap-1"
          >
            <span>←</span> Back
          </button>
          <h1 className="text-3xl font-bold text-white">Your Activity</h1>
        </div>

        {}
        <div className="mb-12">
          <h2 className="text-xl font-bold text-blue-400 border-b border-blue-900/50 pb-2 mb-4 inline-block">
            Created by Me
          </h2>
          {myRequests.length === 0 ? (
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-8 text-center text-gray-500">
              You haven't requested anything yet.
            </div>
          ) : (
            <div className="grid gap-4">
              {myRequests.map((req) => (
                <div key={req.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-bold text-white capitalize">{req.order_type}</h3>
                    <span 
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                        req.status === 'accepted' 
                          ? 'bg-green-900/20 text-green-400' 
                          : 'bg-yellow-900/20 text-yellow-400'
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm mb-4">{req.details || 'No details'}</p>
                  <div className="flex justify-between items-center border-t border-neutral-800 pt-4">
                    <span className="text-xl font-bold text-white">₹{req.price}</span>
                    {req.status === 'accepted' && req.accepter && !isExpired(req.created_at) && (
                      <div className="text-right">
                        <p className="text-sm font-medium text-blue-400">
                          {req.accepter.name || 'Anonymous'}
                        </p>
                        {req.accepter.phone && (
                          <a 
                            href={`tel:${req.accepter.phone}`} 
                            className="text-xs text-green-500 hover:text-green-400"
                          >
                            📞 {req.accepter.phone}
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {}
        <div>
          <h2 className="text-xl font-bold text-green-400 border-b border-green-900/50 pb-2 mb-4 inline-block">
            Accepted by Me
          </h2>
          {acceptedRequests.length === 0 ? (
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-8 text-center text-gray-500">
              You haven't taken any jobs yet.
            </div>
          ) : (
            <div className="grid gap-4">
              {acceptedRequests.map((req) => (
                <div key={req.id} className="bg-neutral-900 border border-green-900/20 rounded-xl p-5">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-bold text-white capitalize">{req.order_type}</h3>
                    <div className="bg-green-600/10 text-green-400 border border-green-600/20 px-3 py-1 rounded-lg text-sm font-bold">
                      + ₹{req.price}
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm mb-4">{req.details || 'No details'}</p>
                  {req.requester && !isExpired(req.created_at) && (
                    <div className="flex justify-between items-center border-t border-neutral-800 pt-4">
                      <p className="text-sm font-bold text-white">
                        {req.requester.name || 'Anonymous'}
                      </p>
                      {req.requester.phone && (
                        <a 
                          href={`tel:${req.requester.phone}`} 
                          className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center hover:bg-green-500 transition"
                        >
                          📞
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}