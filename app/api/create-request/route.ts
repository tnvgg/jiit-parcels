import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { sanitizeInput } from '@/lib/sanitize-api'
import { encryptPhone } from '@/lib/crypto'

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const body = await request.json()
    
    const { requesterId, hostel, gateNumber, orderType, eta, paid, details, price, phone, notificationEmail } = body
    
    if (!requesterId || !hostel || !gateNumber || !orderType || !eta || !price || !phone || !notificationEmail) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('banned')
      .eq('id', requesterId)
      .single()
    
    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    if (userProfile.banned) {
      return NextResponse.json({ error: 'You are banned from posting requests.' }, { status: 403 })
    }

    const phoneEncrypted = encryptPhone(phone)
    const cleanDetails = sanitizeInput(details || '')
    const cleanGate = sanitizeInput(gateNumber)

    await supabase
      .from('profiles')
      .update({ phone_encrypted: phoneEncrypted })
      .eq('id', requesterId)

    const { data, error } = await supabase
      .from('pickup_requests')
      .insert({
        requester_id: requesterId,
        hostel,
        gate_number: cleanGate,
        order_type: orderType,
        eta,
        paid,
        details: cleanDetails,
        price,
        status: 'waiting',
        notification_email: notificationEmail
      })
      .select()
      .single()
    
    if (error) {
      console.error('Database insert error:', error)
      throw error
    }

    return NextResponse.json({ success: true, request: data })
  } catch (error: any) {
    console.error('Create request error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}