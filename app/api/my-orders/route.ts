import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { decryptPhone } from '@/lib/crypto'

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: requests, error } = await supabase
      .from('pickup_requests')
      .select(`
        *,
        requester:profiles!requester_id(id, name, email, phone_encrypted, hostel, gender),
        accepter:profiles!accepted_by(id, name, email, phone_encrypted, hostel, gender)
      `)
      .or(`requester_id.eq.${user.id},accepted_by.eq.${user.id}`)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    const requestsWithDecryptedPhones = requests?.map((req: any) => {
      const isRequester = req.requester_id === user.id
      const isAccepter = req.accepted_by === user.id
      const isMatched = req.status === 'accepted'

      return {
        ...req,
        requester: req.requester ? {
          ...req.requester,
          phone: (isMatched && isAccepter && req.requester.phone_encrypted)
            ? decryptPhone(req.requester.phone_encrypted)
            : null
        } : null,
        accepter: req.accepter ? {
          ...req.accepter,
          phone: (isMatched && isRequester && req.accepter.phone_encrypted)
            ? decryptPhone(req.accepter.phone_encrypted)
            : null
        } : null
      }
    })

    return NextResponse.json({ orders: requestsWithDecryptedPhones })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}