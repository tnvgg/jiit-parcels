import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const { requestId, newPrice } = await request.json()
    
    if (!requestId || !newPrice) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    if (newPrice < 0 || newPrice > 1000) {
      return NextResponse.json({ error: 'Invalid price range' }, { status: 400 })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: pickupRequest, error: fetchError } = await supabase
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

    const { error: updateError } = await supabase
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