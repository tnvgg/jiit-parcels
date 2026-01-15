import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { encryptPhone } from '@/lib/crypto'
import { sanitizeInput, validatePhone } from '@/lib/sanitize'

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const body = await request.json()
    const { userId, phone, hostel, gender } = body
    
    if (!userId || !phone || !hostel) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }
    
    if (!validatePhone(phone)) {
      return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 })
    }

    const encryptedPhone = encryptPhone(phone)

    const { error } = await supabase
      .from('profiles')
      .update({
        phone_encrypted: encryptedPhone,
        hostel,
        gender: gender || null
      })
      .eq('id', userId)
    
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