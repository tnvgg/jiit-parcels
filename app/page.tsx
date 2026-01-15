'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import PickupCard from '@/components/PickupCard'
import { PickupRequest, Hostel } from '@/types/database'

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL

export default function HomePage() {
  const router = useRouter()
  const [requests, setRequests] = useState<PickupRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [checkingAuth, setCheckingAuth] = useState(true)

  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [isBanned, setIsBanned] = useState(false)
  const [showAdminBtn, setShowAdminBtn] = useState(false)

  const [hostelFilter, setHostelFilter] = useState<Hostel | ''>('')
  const [gateFilter, setGateFilter] = useState<string>('')

  useEffect(() => {
    async function checkUser() {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.replace('/login')
        return
      }
      
      const user = session.user
      setCurrentUserId(user.id)

      if (ADMIN_EMAIL && user.email === ADMIN_EMAIL) {
        setShowAdminBtn(true)
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('banned')
        .eq('id', user.id)
        .single()

      if (profile) setIsBanned(profile.banned)
      
      setCheckingAuth(false)
    }

    checkUser()
  }, [router])

  useEffect(() => {
    if (!checkingAuth && currentUserId) {
      fetchData()

      const channel = supabase
        .channel('pickup_requests_home')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'pickup_requests' 
        }, () => {
          fetchData()
        })
        .subscribe()

      return () => { supabase.removeChannel(channel) }
    }
  }, [hostelFilter, gateFilter, checkingAuth, currentUserId])

  async function fetchData() {
    setLoading(true)

    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()

    let query = supabase
      .from('pickup_requests')
      .select(`
        *,
        requester:profiles!pickup_requests_requester_id_fkey(id, name, email, phone, phone_encrypted, hostel, gender),
        accepter:profiles!pickup_requests_accepted_by_fkey(id, name, email, phone, phone_encrypted, hostel, gender)
      `)
      .eq('status', 'waiting')
      .gte('created_at', twoHoursAgo)
      .order('price', { ascending: false })

    // Apply Filters
    if (hostelFilter) query = query.eq('hostel', hostelFilter)
    if (gateFilter) query = query.eq('gate_number', gateFilter)

    const { data, error } = await query

    if (error) {
      console.error('Error fetching requests:', error)
      setRequests([])
    } else {
      const validRequests = (data || []).filter(
        (req: any) => req.requester !== null
      ) as PickupRequest[]
      setRequests(validRequests)
    }

    setLoading(false)
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-gray-200 p-4 pb-20">
      <div className="max-w-2xl mx-auto space-y-6">
        {}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white tracking-tight">JIIT Parcels</h1>
          <div className="flex gap-2 items-center">
            {showAdminBtn && (
              <button 
                onClick={() => router.push('/admin')} 
                className="bg-red-900/30 text-red-400 border border-red-900/50 px-3 py-2 rounded-full text-xs font-bold uppercase tracking-wider"
              >
                Admin
              </button>
            )}
            <button 
              onClick={() => router.push('/my-orders')} 
              className="bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded-full text-sm font-medium transition border border-neutral-700"
            >
              My Activity
            </button>
            <button 
              onClick={() => router.push('/new')} 
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg shadow-blue-900/20 transition"
            >
              + Request
            </button>
          </div>
        </div>

        {}
        <div className="bg-neutral-900/50 border border-neutral-800 p-4 rounded-xl flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="text-xs text-gray-500 mb-1 block uppercase tracking-wider">
              Filter by Hostel
            </label>
            <select
              value={hostelFilter}
              onChange={(e) => setHostelFilter(e.target.value as Hostel | '')}
              className="w-full bg-neutral-800 text-white border border-neutral-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="">All Hostels</option>
              <option value="ABB3">ABB3</option>
              <option value="Sarojini">Sarojini</option>
              <option value="H3">H3</option>
              <option value="H4">H4</option>
              <option value="H5">H5</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="text-xs text-gray-500 mb-1 block uppercase tracking-wider">
              Filter by Gate
            </label>
            <select
              value={gateFilter}
              onChange={(e) => setGateFilter(e.target.value)}
              className="w-full bg-neutral-800 text-white border border-neutral-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="">All Gates</option>
              <option value="1">Gate 1</option>
              <option value="2">Gate 2</option>
              <option value="3">Gate 3</option>
            </select>
          </div>
        </div>

        {}
        {loading ? (
          <div className="text-center py-20 text-gray-500 animate-pulse">
            Loading live requests...
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-20">
            <h3 className="text-xl font-bold text-white mb-2">No active requests</h3>
            <p className="text-gray-500 max-w-xs mx-auto">
              {hostelFilter || gateFilter 
                ? 'Try changing your filters.' 
                : 'Requests older than 2 hours disappear automatically.'}
            </p>
            {(hostelFilter || gateFilter) && (
              <button 
                onClick={() => { setHostelFilter(''); setGateFilter('') }} 
                className="mt-4 text-blue-400 hover:text-blue-300 text-sm font-medium"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-gray-500 text-right">
              Showing {requests.length} active requests • Sorted by Price
            </p>
            {requests.map((req) => (
              <PickupCard 
                key={req.id} 
                request={req} 
                currentUserId={currentUserId} 
                isBanned={isBanned} 
                onUpdate={fetchData} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}