import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { decryptPhone } from '@/lib/crypto'

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('My Orders Auth Error:', authError)
      return NextResponse.json({ error: 'Unauthorized: Session missing or expired' }, { status: 401 })
    }

    const userId = user.id

    const { data: requests, error } = await supabase
      .from('pickup_requests')
      .select(`
        *,
        requester:profiles!pickup_requests_requester_id_fkey(id, name, email, phone_encrypted, hostel, gender),
        accepter:profiles!pickup_requests_accepted_by_fkey(id, name, email, phone_encrypted, hostel, gender)
      `)
      .or(`requester_id.eq.${userId},accepted_by.eq.${userId}`)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Database Query Error:', error)
      throw error
    }

    const safeOrders = requests?.map((req: any) => {
      const isRequester = req.requester_id === userId
      const isAccepter = req.accepted_by === userId
      const isMatched = req.status === 'accepted'
      
      let requesterPhone = null
      let accepterPhone = null

      if (req.requester?.phone_encrypted) {
        if (isAccepter || isRequester) {
          requesterPhone = decryptPhone(req.requester.phone_encrypted)
        }
      }
      
      if (req.accepter?.phone_encrypted) {
        if ((isRequester && isMatched) || isAccepter) {
          accepterPhone = decryptPhone(req.accepter.phone_encrypted)
        }
      }

      return {
        ...req,
        requester: req.requester ? {
          ...req.requester,
          phone: requesterPhone
        } : null,
        accepter: req.accepter ? {
          ...req.accepter,
          phone: accepterPhone
        } : null
      }
    })

    return NextResponse.json({ orders: safeOrders || [] })
  } catch (error: any) {
    console.error('My orders fatal error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}