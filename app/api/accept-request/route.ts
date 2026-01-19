import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { decryptPhone } from '@/lib/crypto'
import { sendAcceptanceEmail } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { requestId, accepterId } = body

    if (!requestId || !accepterId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: accepterProfile, error: accepterError } = await supabase
      .from('profiles')
      .select('banned, name, phone_encrypted')
      .eq('id', accepterId)
      .single()

    if (accepterError || !accepterProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (accepterProfile.banned) {
      return NextResponse.json({ error: 'You are banned.' }, { status: 403 })
    }

    const { data: pickupRequest, error: requestError } = await supabase
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
      return NextResponse.json({ error: 'Request already accepted' }, { status: 400 })
    }

    const { error: updateError } = await supabase
      .from('pickup_requests')
      .update({
        status: 'accepted',
        accepted_by: accepterId
      })
      .eq('id', requestId)

    if (updateError) {
      throw updateError
    }

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
      console.error('Email failed:', emailError)
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
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}