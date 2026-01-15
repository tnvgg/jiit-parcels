export type Hostel = 'ABB3' | 'Sarojini' | 'H4' | 'H5'
export type OrderType = 'food' | 'package'
export type RequestStatus = 'waiting' | 'accepted'
export type UserRole = 'user' | 'admin'

export interface Profile {
  id: string
  name: string
  email: string
  phone_encrypted?: string
  phone?: string
  hostel: Hostel
  gender: string
  role: UserRole
  banned: boolean
}

export interface PickupRequest {
  id: string
  requester_id: string
  hostel: Hostel
  gate_number: string
  order_type: OrderType
  eta: string
  paid: boolean
  details: string
  price: number
  status: RequestStatus
  accepted_by: string | null
  created_at: string
  requester?: Profile
  accepter?: Profile
}

export interface Report {
  id: string
  request_id: string
  reporter_id: string
  reported_user_id: string
  reason: string
  created_at: string
  reporter?: Profile
  reported_user?: Profile
  request?: PickupRequest
}