import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
  
    return NextResponse.redirect(`${requestUrl.origin}/?code=${code}`)
  }

  return NextResponse.redirect(`${requestUrl.origin}/login`)
}