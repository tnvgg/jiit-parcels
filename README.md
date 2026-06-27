# JIIT Parcels

A peer-to-peer delivery network built for JIIT students. The idea is that if you're already heading back from the gate, you might as well pick up someone's parcel or food order and earn a little for the trouble.

Live at **[jiit-parcels.vercel.app](https://jiit-parcels.vercel.app)**

Got 200 users in the first two days which was honestly unexpected.

---

## What it does

Students post pickup requests, they specify which gate their order is arriving at, which hostel they're in, when it's expected, and how much they're willing to pay. Other students browsing the feed can accept a request, at which point both parties get each other's contact details over email and can coordinate directly.

Supports both food orders and packages. Fee is set by the requester via a slider so it's negotiated upfront.

---

<table>
  <tr>
    <td><img src="https://github.com/user-attachments/assets/febd45de-ca1f-41d1-8c0c-4c10d6b5c960" width="220"/></td>    
    <td><img src="https://github.com/user-attachments/assets/b4fe3059-5e55-41a1-9532-843fd35471a4" width="220"/></td>
    <td><img src="https://github.com/user-attachments/assets/9be52ca2-86d9-464c-8f1f-0ae33ee3b765" width="220"/></td>
    <td><img src="https://github.com/user-attachments/assets/ade2ed87-134c-490e-827d-1b5a3a4d5b3c" width="220"/></td>
  </tr>
  <tr>
    <td><img src="https://github.com/user-attachments/assets/543e6d19-efab-43c9-9ca1-b9f450dbf489" width="220"/></td>
    <td><img src="https://github.com/user-attachments/assets/76dede38-4e90-45b6-8649-73cf79507c1a" width="220"/></td>
    <td><img src="https://github.com/user-attachments/assets/cb80a0fc-f802-4d73-b3e3-4da4021e0b2f" width="220"/></td>
    <td><img src="https://github.com/user-attachments/assets/ec3a94ba-5895-4483-8fb3-2ee1361f0d98" width="220"/></td>
  </tr>
</table>

---

## Stack

- **Frontend:** Next.js 16 (App Router) + Tailwind CSS
- **Backend:** Next.js Serverless API routes
- **Database + Auth:** Supabase (PostgreSQL + Supabase Auth)
- **Email:** Nodemailer over Gmail SMTP
- **Session handling:** `@supabase/ssr` with HTTP-only cookies

---

## Database

### `profiles`
User identity. Email is restricted to `@mail.jiit.ac.in` at the DB level so outsiders can't sign up at all. Phone numbers are stored AES-encrypted and they only get decrypted and shared when a request is actually accepted.

| column | type | notes |
|---|---|---|
| id | uuid | mirrors Supabase Auth user |
| name | text | |
| email | text | `@mail.jiit.ac.in` only |
| phone_encrypted | text | AES encrypted |
| hostel | enum | ABB3, Sarojini, H3, H4, H5 |
| gender | text | |
| role | enum | user / admin |
| banned | boolean | blocks access to all mutation endpoints |

### `pickup_requests`
Request log.

| column | type | notes |
|---|---|---|
| id | uuid | |
| requester_id | uuid | FK → profiles |
| hostel | enum | delivery destination |
| gate_number | text | pickup origin |
| order_type | enum | food / package |
| eta | text | expected arrival time |
| paid | boolean | whether it's already paid for at source |
| details | text | max 1000 chars |
| price | numeric | the bounty |
| status | enum | waiting / accepted |
| accepted_by | uuid | FK → profiles, null until matched |
| created_at | timestamp | |

### `reports`
For flagging bad actors. Admin reviews these.

| column | type | notes |
|---|---|---|
| id | uuid | |
| request_id | uuid | FK → pickup_requests |
| reporter_id | uuid | FK → profiles |
| reported_user_id | uuid | FK → profiles |
| reason | text | |

---

## How the auth and security works (for the nerds)

### No direct DB writes from the client
The Supabase anon key is exposed client-side (it has to be, for reads). But if you let clients write directly to the DB using the anon key, even with RLS, you open yourself up to impersonation attacks where someone crafts a payload with a spoofed `requester_id`. So all mutations go through Next.js API routes instead. The server pulls the session from the HTTP-only cookie, verifies identity, then uses the service role key to execute the write. Users never touch the service role key.

### Middleware token refresh
Next.js middleware intercepts every route transition and checks token validity. If the access token is expired it silently refreshes it using the refresh token in the cookie. No unexpected logouts.

### Phone number privacy
Phone numbers are PII so they're encrypted before going into the DB. The decryption keys live only in server-side env vars. When a request gets accepted, the backend decrypts both parties' numbers and sends them out via the secure API response + the SMTP email. Nobody can scrape contact info by poking the DB directly.

### Row-level security
RLS policies on all tables as an extra layer on top of the server-side validation.

---

## Running locally

```bash
git clone <repo>
cd jiit-parcels
npm install
```

Create a `.env.local` at the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GMAIL_USER=your_smtp_email
GMAIL_APP_PASSWORD=your_smtp_password
NEXT_PUBLIC_ADMIN_EMAIL=your_admin_email
```

Then:

```bash
npm run dev
```

Open [localhost:3000](http://localhost:3000).

---

## Notes

- Only works with a `@mail.jiit.ac.in` email. That's intentional.
- The encryption key for phone numbers needs to be in your env or decryption will fail silently on request acceptance.
- If you're setting up Gmail SMTP, you need an App Password, not your regular Gmail password.
