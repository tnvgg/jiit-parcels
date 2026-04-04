import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { encryptPhone } from '@/lib/crypto'
import { sanitizeInput, validatePhone } from '@/lib/sanitize'

export async function POST(request: Request) {
  try {
    const supabaseServer = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { phone, hostel, gender } = body 

    if (!phone || !hostel) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    if (!validatePhone(phone)) {
      return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 })
    }

    const encryptedPhone = encryptPhone(phone)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({
        phone_encrypted: encryptedPhone,
        hostel,
        gender: gender || null
      })
      .eq('id', user.id) 

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Setup profile error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}