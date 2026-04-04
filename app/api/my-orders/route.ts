import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { decryptPhone } from '@/lib/crypto'

export async function GET(request: Request) {
  try {
    const supabaseServer = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: requests, error } = await supabaseAdmin
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
    console.error("My Orders API Error:", error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}