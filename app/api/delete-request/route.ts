import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { requestId, userId } = await request.json()

    if (!requestId) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 })
    }

    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: { user } } = await supabaseAdmin.auth.getUser(token)
    if (!user) {
      return NextResponse.json({ error: 'Invalid user' }, { status: 401 })
    }

 
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.role === 'admin'

    const { data: pickupRequest, error: fetchError } = await supabaseAdmin
      .from('pickup_requests')
      .select('requester_id, status')
      .eq('id', requestId)
      .single()

    if (fetchError || !pickupRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    const isOwner = pickupRequest.requester_id === user.id
    
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ 
        error: 'You can only delete your own requests' 
      }, { status: 403 })
    }

    if (!isAdmin && pickupRequest.status === 'accepted') {
      return NextResponse.json({ 
        error: 'Cannot delete accepted requests. Please report any issues instead.' 
      }, { status: 400 })
    }

    const { error: deleteError } = await supabaseAdmin
      .from('pickup_requests')
      .delete()
      .eq('id', requestId)

    if (deleteError) {
      throw deleteError
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete request error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}