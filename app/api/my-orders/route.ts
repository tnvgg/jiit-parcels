import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('Auth Error in my-orders:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.id
    console.log('✅ Fetching orders for user:', userId)

    const { data: orders, error: fetchError } = await supabase
      .from('pickup_requests')
      .select(`
        *,
        requester:profiles!pickup_requests_requester_id_fkey(id, name, email, phone, hostel, gender),
        accepter:profiles!pickup_requests_accepted_by_fkey(id, name, email, phone, hostel, gender)
      `)
      .or(`requester_id.eq.${userId},accepted_by.eq.${userId}`)
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('Database error:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
        { status: 500 }
      )
    }

    console.log(`✅ Found ${orders?.length || 0} orders`)

    return NextResponse.json({ 
      orders: orders || [],
      userId 
    })

  } catch (error: any) {
    console.error('❌ Fatal Error in my-orders:', error)
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}