import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { decryptPhone } from '@/lib/crypto'

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const [requestsRes, usersRes, reportsRes] = await Promise.all([
      supabaseAdmin.from('pickup_requests').select('*, requester:profiles!requester_id(*), accepter:profiles!accepted_by(*)').order('created_at', { ascending: false }),
      supabaseAdmin.from('profiles').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('reports').select('*, reporter:profiles!reporter_id(*), reported_user:profiles!reported_user_id(*), request:pickup_requests(*)').order('created_at', { ascending: false })
    ])

    const decryptProfile = (p: any) => {
      if (!p) return null
      if (p.phone_encrypted) p.phone = decryptPhone(p.phone_encrypted)
      return p
    }

    const requests = (requestsRes.data || []).map(r => ({
      ...r,
      requester: decryptProfile(r.requester),
      accepter: decryptProfile(r.accepter)
    }))

    const users = (usersRes.data || []).map(u => decryptProfile(u))

    const reports = (reportsRes.data || []).map(r => ({
      ...r,
      reporter: decryptProfile(r.reporter),
      reported_user: decryptProfile(r.reported_user)
    }))

    return NextResponse.json({ requests, users, reports })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}