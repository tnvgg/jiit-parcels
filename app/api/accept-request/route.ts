import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendAcceptanceEmail } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { requestId, accepterId, accepterPhone } = body
    
    if (!requestId || !accepterId) {
      return NextResponse.json({ error: 'Sign in again by clicking on + Request' }, { status: 400 })
    }

    const { data: accepterProfile, error: accepterError } = await supabaseAdmin
      .from('profiles')
      .select('banned, name')
      .eq('id', accepterId)
      .single()

    if (accepterError || !accepterProfile) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    if (accepterProfile.banned) return NextResponse.json({ error: 'You are banned.' }, { status: 403 })

    if (!accepterPhone || accepterPhone.length < 10) {
        return NextResponse.json({ error: 'Valid phone number required' }, { status: 400 })
    }

    await supabaseAdmin
        .from('profiles')
        .update({ phone: accepterPhone })
        .eq('id', accepterId)

    const { data: pickupRequest, error: requestError } = await supabaseAdmin
      .from('pickup_requests')
      .select(`
        *, 
        requester:profiles!requester_id (
          name, 
          email, 
          phone
        )
      `)
      .eq('id', requestId)
      .single()

    if (requestError || !pickupRequest) return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    if (pickupRequest.status === 'accepted') return NextResponse.json({ error: 'Request already accepted' }, { status: 400 })

    const { error: updateError } = await supabaseAdmin
      .from('pickup_requests')
      .update({
        status: 'accepted',
        accepted_by: accepterId
      })
      .eq('id', requestId)

    if (updateError) throw updateError
    const targetEmail = pickupRequest.notification_email || pickupRequest.requester.email
    try {
        await sendAcceptanceEmail({
            to: targetEmail,
            requesterName: pickupRequest.requester.name,
            acceptorName: accepterProfile.name,
            acceptorPhone: accepterPhone, 
            requestDetails: {
                orderType: pickupRequest.order_type,
                hostel: pickupRequest.hostel,
                gate: pickupRequest.gate_number,
                price: pickupRequest.price,
                requestId: pickupRequest.id
            }
        })
    } catch (e) { console.error("Email failed:", e) }

    return NextResponse.json({ 
      success: true,
      requesterName: pickupRequest.requester.name,
      requesterPhone: pickupRequest.requester?.phone || 'Not provided'
    })

  } catch (error: any) {
    console.error('Accept error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}