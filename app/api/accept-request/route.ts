import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { sendAcceptanceEmail } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const { requestId, accepterPhone } = await request.json()

    if (!requestId) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('Auth Error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const accepterId = user.id
    console.log('✅ User authenticated:', accepterId)

    if (!accepterPhone || accepterPhone.length < 10) {
      return NextResponse.json(
        { error: 'Valid phone number required' },
        { status: 400 }
      )
    }

    const { data: accepterProfile, error: profileError } = await supabase
      .from('profiles')
      .select('banned, name')
      .eq('id', accepterId)
      .single()
    
    if (profileError || !accepterProfile) {
      console.error('Profile Error:', profileError)
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }
    
    if (accepterProfile.banned) {
      return NextResponse.json({ error: 'You are banned' }, { status: 403 })
    }

    console.log('✅ Profile valid:', accepterProfile.name)

    const { error: phoneUpdateError } = await supabase
      .from('profiles')
      .update({ phone: accepterPhone })
      .eq('id', accepterId)
    
    if (phoneUpdateError) {
      console.error('Phone Update Error:', phoneUpdateError)
      return NextResponse.json(
        { error: 'Failed to update phone number' },
        { status: 500 }
      )
    }

    console.log('✅ Phone updated')

    const { data: pickupRequest, error: fetchError } = await supabase
      .from('pickup_requests')
      .select(`
        id,
        order_type,
        hostel,
        gate_number,
        price,
        status,
        details,
        notification_email,
        requester:profiles!pickup_requests_requester_id_fkey (
          name,
          email,
          phone
        )
      `)
      .eq('id', requestId)
      .single()
    
    if (fetchError || !pickupRequest) {
      console.error('Fetch Error:', fetchError)
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }
    
    if (pickupRequest.status === 'accepted') {
      return NextResponse.json(
        { error: 'Request already accepted' },
        { status: 400 }
      )
    }

    console.log('✅ Request found:', pickupRequest.id)

    const { data: updatedRequest, error: updateError } = await supabase
      .from('pickup_requests')
      .update({
        status: 'accepted',
        accepted_by: accepterId,
        acceptor_phone: accepterPhone
      })
      .eq('id', requestId)
      .eq('status', 'waiting') 
      .select()
      .single()
    
    if (updateError) {
      console.error('❌ Update Error:', updateError)
      return NextResponse.json(
        { error: `Database error: ${updateError.message}` },
        { status: 500 }
      )
    }

    if (!updatedRequest) {
      return NextResponse.json(
        { error: 'Request already accepted by someone else' },
        { status: 400 }
      )
    }

    console.log('✅ Request accepted successfully')

    const requester = pickupRequest.requester as any
    const targetEmail = pickupRequest.notification_email || requester?.email
    
    if (targetEmail && requester) {
      try {
        await sendAcceptanceEmail({
          to: targetEmail,
          requesterName: requester.name,
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
        console.log('✅ Email sent')
      } catch (emailError) {
        console.error('Email failed:', emailError)
      }
    }

    return NextResponse.json({
      success: true,
      requesterName: requester?.name || 'Unknown',
      requesterPhone: requester?.phone || 'Not provided'
    })

  } catch (error: any) {
    console.error('❌ Fatal Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}
