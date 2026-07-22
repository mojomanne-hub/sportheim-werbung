import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const isLoginPage = request.nextUrl.pathname === '/admin/login'
  const authCookie = request.cookies.get('admin_auth')?.value

  if (!isLoginPage && authCookie !== process.env.ADMIN_PASSWORD) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/admin/:path*',
}