import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { sanitizeInput } from '@/lib/sanitize-api'
import { encryptPhone } from '@/lib/crypto'

export async function POST(request: Request) {
  try {
    const supabaseServer = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 })
    }

    const body = await request.json()
    const { hostel, gateNumber, orderType, eta, paid, details, price, phone, notificationEmail } = body
    
    if (!phone || !gateNumber || !price) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('banned, email')
      .eq('id', user.id) 
      .single()
    
    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'User profile not found.' }, { status: 404 })
    }

    if (userProfile.banned) {
      return NextResponse.json({ error: 'You are banned from posting requests.' }, { status: 403 })
    }

    const email = userProfile.email || ''
    if (!email.endsWith('@mail.jiit.ac.in')) {
      return NextResponse.json({ error: 'Only JIIT students can post requests.' }, { status: 403 })
    }

    const phoneEncrypted = encryptPhone(phone)
    const cleanDetails = sanitizeInput(details || '')
    const cleanGate = sanitizeInput(gateNumber)

    await supabaseAdmin
      .from('profiles')
      .update({ phone_encrypted: phoneEncrypted })
      .eq('id', user.id)

    const { data, error } = await supabaseAdmin
      .from('pickup_requests')
      .insert({
        requester_id: user.id, 
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
    
    if (error) throw error

    return NextResponse.json({ success: true, request: data })
    
  } catch (error: any) {
    console.error('Create request error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}