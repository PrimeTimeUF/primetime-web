import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Get the session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const pathname = request.nextUrl.pathname

  // Protect dashboard routes
  if (pathname.startsWith('/teacher') || pathname.startsWith('/student')) {
    if (!session) {
      // Not authenticated, redirect to login
      const redirectUrl = new URL('/login', request.url)
      return NextResponse.redirect(redirectUrl)
    }

    // Check if user is accessing the correct role-based dashboard
    // Fetch user role from database
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (userData) {
      // Redirect teacher to teacher dashboard if accessing student
      if (userData.role === 'teacher' && pathname.startsWith('/student')) {
        return NextResponse.redirect(new URL('/teacher', request.url))
      }
      // Redirect student to student dashboard if accessing teacher
      if (userData.role === 'student' && pathname.startsWith('/teacher')) {
        return NextResponse.redirect(new URL('/student', request.url))
      }
    }
  }

  // Redirect authenticated users away from auth pages and root
  if ((pathname === '/' || pathname === '/login' || pathname === '/signup') && session) {
    // Get user role to redirect to appropriate dashboard
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (userData) {
      const dashboardUrl = userData.role === 'teacher' ? '/teacher' : '/student'
      return NextResponse.redirect(new URL(dashboardUrl, request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
