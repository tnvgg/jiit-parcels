'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { PickupRequest, Report, Profile } from '@/types/database'
import { useRouter } from 'next/navigation'
import { formatTime } from '@/lib/utils'

export default function AdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'requests' | 'reports' | 'users'>('requests')
  
  const [requests, setRequests] = useState<PickupRequest[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [users, setUsers] = useState<Profile[]>([])

  useEffect(() => {
    fetchAdminData()
  }, [])

  async function fetchAdminData() {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      router.push('/login')
      return
    }

    try {
      const response = await fetch('/api/admin/data', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })

      if (!response.ok) {
        if (response.status === 403) router.push('/')
        return
      }

      const data = await response.json()
      setRequests(data.requests)
      setUsers(data.users)
      setReports(data.reports)
    } catch (error) {
      console.error("Admin fetch error:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteRequest(requestId: string) {
    if (!confirm('Delete this request permanently?')) return
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    await fetch('/api/delete-request', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ requestId })
    })
    
    fetchAdminData() 
  }

  async function handleBanUser(userId: string, currentBanStatus: boolean) {
    const action = currentBanStatus ? 'unban' : 'ban'
    if (!confirm(`${action.toUpperCase()} this user?`)) return

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    await fetch('/api/ban-user', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ userId, banned: !currentBanStatus })
    })

    fetchAdminData() 
  }

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading Admin Panel...</div>

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
          <p className="text-sm text-gray-400 mt-1">Manage requests, reports, and users</p>
        </div>
        <button onClick={() => router.push('/')} className="px-4 py-2 border border-neutral-700 text-gray-300 rounded-lg hover:bg-neutral-800 transition">
          ← Back to Home
        </button>
      </div>

      <div className="flex gap-4 mb-6 border-b border-neutral-800">
        {['requests', 'reports', 'users'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`pb-3 px-1 font-medium capitalize transition ${
              activeTab === tab ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'requests' && (
        <div className="space-y-4">
          {requests.map(request => (
            <div key={request.id} className="bg-neutral-900 border border-neutral-800 rounded-lg p-5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${request.status === 'waiting' ? 'bg-blue-900/30 text-blue-400' : 'bg-green-900/30 text-green-400'}`}>
                      {request.status.toUpperCase()}
                    </span>
                    <span className="px-3 py-1 bg-neutral-800 text-gray-300 rounded-full text-sm">Gate {request.gate_number}</span>
                  </div>
                  <p className="text-sm text-gray-400">By: <span className="text-white font-medium">{request.requester?.name}</span></p>
                  <p className="text-xs text-gray-500">{formatTime(request.created_at)}</p>
                </div>
                <p className="text-xl font-bold text-white">₹{request.price}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4 text-sm text-gray-300">
                <p>Phone: {request.requester?.phone || 'N/A'}</p>
                <p>Hostel: {request.hostel}</p>
              </div>
              <button onClick={() => handleDeleteRequest(request.id)} className="w-full px-4 py-2 bg-red-900/30 text-red-400 border border-red-900/50 rounded-lg hover:bg-red-900/50 transition">
                Delete Request
              </button>
            </div>
          ))}
          {requests.length === 0 && <p className="text-gray-500 text-center py-10">No requests found</p>}
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-4">
          {users.map(user => (
            <div key={user.id} className="bg-neutral-900 border border-neutral-800 rounded-lg p-5 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-white flex gap-2 items-center">
                  {user.name}
                  {user.banned && <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded">BANNED</span>}
                  {user.role === 'admin' && <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded">ADMIN</span>}
                </h3>
                <p className="text-sm text-gray-400">{user.email}</p>
                <p className="text-sm text-blue-400">{user.phone || 'Encrypted'}</p>
              </div>
              {user.role !== 'admin' && (
                <button
                  onClick={() => handleBanUser(user.id, user.banned)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${user.banned ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}
                >
                  {user.banned ? 'Unban' : 'Ban'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      
      {activeTab === 'reports' && (
        <div className="space-y-4">
            {reports.length === 0 && <p className="text-gray-500 text-center py-10">No reports found</p>}
            {reports.map(report => (
                <div key={report.id} className="bg-neutral-900 border border-neutral-800 rounded-lg p-5">
                    <p className="text-red-400 font-bold mb-2">Report against: {report.reported_user?.name}</p>
                    <p className="text-gray-300 bg-neutral-800 p-3 rounded mb-3">"{report.reason}"</p>
                    <p className="text-xs text-gray-500 mb-3">Reported by: {report.reporter?.name}</p>
                    {report.reported_user && (
                        <button
                        onClick={() => handleBanUser(report.reported_user_id, report.reported_user?.banned || false)}
                        className="text-sm bg-red-600 text-white px-3 py-1 rounded"
                        >
                        {report.reported_user.banned ? 'Unban User' : 'Ban User'}
                        </button>
                    )}
                </div>
            ))}
        </div>
      )}
    </div>
  )
}