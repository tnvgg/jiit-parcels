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
    let isMounted = true

    const timer = setTimeout(() => {
      if (isMounted) setLoading(false)
    }, 4000)

    async function loadOrders() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }
        if (isMounted) setUserId(user.id)

        const response = await fetch('/api/my-orders', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        })

        if (response.ok) {
          const data = await response.json()
          if (isMounted && data.orders) setRequests(data.orders)
        }
      } catch (err) {
        console.error(err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    
    loadOrders()
    return () => { isMounted = false; clearTimeout(timer) }
  }, [router]) 

  if (loading) {
    return (
       <div className="min-h-screen bg-black flex items-center justify-center text-gray-500">
         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4 mr-3"></div>
         Loading activity...
       </div>
    )
  }

  const myRequests = requests.filter(r => r.requester_id === userId)
  const acceptedRequests = requests.filter(r => r.accepted_by === userId)

  return (
    <div className="min-h-screen bg-black py-8 px-4 pb-24">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.push('/')} className="text-blue-400 hover:text-blue-300 transition">← Back</button>
          <h1 className="text-3xl font-bold text-white">Your Activity</h1>
        </div>

        {}
        <div className="mb-12">
          <h2 className="text-xl font-bold text-blue-400 border-b border-blue-900/50 pb-2 mb-4 inline-block">Created by Me</h2>
          {myRequests.length === 0 ? (
            <p className="text-gray-500">You haven't requested anything yet.</p>
          ) : (
            <div className="grid gap-4">
              {myRequests.map(req => (
                <div key={req.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 hover:border-neutral-700 transition">
                   <div className="flex justify-between items-start">
                     <h3 className="text-white font-bold capitalize text-lg">{req.order_type}</h3>
                     <span className={`text-sm px-3 py-1 rounded-full ${req.status === 'accepted' ? 'bg-green-900/30 text-green-400' : 'bg-blue-900/30 text-blue-400'} capitalize font-medium`}>
                       {req.status}
                     </span>
                   </div>
                   <p className="text-gray-400 text-sm mt-3 font-medium">Price: <span className="text-gray-200">₹{req.price}</span></p>
                </div>
              ))}
            </div>
          )}
        </div>

        {}
        <div>
          <h2 className="text-xl font-bold text-green-400 border-b border-green-900/50 pb-2 mb-4 inline-block">Accepted by Me</h2>
           {acceptedRequests.length === 0 ? (
            <p className="text-gray-500">You haven't accepted any orders yet.</p>
          ) : (
            <div className="grid gap-4">
              {acceptedRequests.map(req => (
                <div key={req.id} className="bg-neutral-900 border border-green-900/30 rounded-xl p-5">
                   <div className="flex justify-between items-start">
                     <h3 className="text-white font-bold capitalize text-lg">{req.order_type}</h3>
                     <span className="text-green-400 text-sm font-bold bg-green-900/20 px-3 py-1 rounded-full">+ ₹{req.price}</span>
                   </div>
                   <p className="text-gray-400 text-sm mt-3 font-medium">Hostel: <span className="text-gray-200">{req.hostel}</span></p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}