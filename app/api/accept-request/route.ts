import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { decryptPhone } from '@/lib/crypto'
import { sendAcceptanceEmail } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const supabaseServer = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    const body = await request.json()
    const { requestId } = body

    if (!requestId) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: accepterProfile, error: accepterError } = await supabaseAdmin
      .from('profiles')
      .select('banned, name, phone_encrypted')
      .eq('id', user.id) 
      .single()

    if (accepterError || !accepterProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (accepterProfile.banned) {
      return NextResponse.json({ error: 'You are banned.' }, { status: 403 })
    }

    const { data: pickupRequest, error: requestError } = await supabaseAdmin
      .from('pickup_requests')
      .select(`
        *,
        requester:profiles!requester_id (
          name,
          email,
          phone_encrypted
        )
      `)
      .eq('id', requestId)
      .single()

    if (requestError || !pickupRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    if (pickupRequest.status === 'accepted') {
      return NextResponse.json({ error: 'This request has already been accepted' }, { status: 400 })
    }
    
    if (pickupRequest.requester_id === user.id) {
      return NextResponse.json({ error: 'You cannot accept your own request' }, { status: 400 })
    }

    const { error: updateError } = await supabaseAdmin
      .from('pickup_requests')
      .update({
        status: 'accepted',
        accepted_by: user.id 
      })
      .eq('id', requestId)

    if (updateError) throw updateError

    const requesterPhone = pickupRequest.requester?.phone_encrypted 
      ? decryptPhone(pickupRequest.requester.phone_encrypted) 
      : null

    const accepterPhone = accepterProfile.phone_encrypted
      ? decryptPhone(accepterProfile.phone_encrypted)
      : null

    try {
      await sendAcceptanceEmail({
        to: pickupRequest.requester.email,
        requesterName: pickupRequest.requester.name,
        acceptorName: accepterProfile.name,
        acceptorPhone: accepterPhone || 'Not provided',
        requestDetails: {
          orderType: pickupRequest.order_type,
          hostel: pickupRequest.hostel,
          gate: pickupRequest.gate_number,
          price: pickupRequest.price,
          requestId: pickupRequest.id
        }
      })
    } catch (emailError) {
      console.error('Email failed to send, but request accepted:', emailError)
    }

    return NextResponse.json({ 
      success: true,
      requesterName: pickupRequest.requester.name,
      requesterPhone: requesterPhone,
      accepterName: accepterProfile.name,
      accepterPhone: accepterPhone
    })
  } catch (error: any) {
    console.error('Accept request error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}