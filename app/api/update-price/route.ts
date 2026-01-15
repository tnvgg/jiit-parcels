import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { requestId, newPrice } = await request.json()

    if (!requestId || !newPrice) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (newPrice < 0 || newPrice > 1000) {
      return NextResponse.json({ error: 'Invalid price range' }, { status: 400 })
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

    // Fetch the request
    const { data: pickupRequest, error: fetchError } = await supabaseAdmin
      .from('pickup_requests')
      .select('requester_id, status, price')
      .eq('id', requestId)
      .single()

    if (fetchError || !pickupRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    if (pickupRequest.requester_id !== user.id) {
      return NextResponse.json({ 
        error: 'You can only update your own requests' 
      }, { status: 403 })
    }

    if (pickupRequest.status === 'accepted') {
      return NextResponse.json({ 
        error: 'Cannot update price after request is accepted' 
      }, { status: 400 })
    }

    if (newPrice <= pickupRequest.price) {
      return NextResponse.json({ 
        error: `Price must be higher than current price (₹${pickupRequest.price})` 
      }, { status: 400 })
    }

    const { error: updateError } = await supabaseAdmin
      .from('pickup_requests')
      .update({ price: newPrice })
      .eq('id', requestId)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Update price error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}