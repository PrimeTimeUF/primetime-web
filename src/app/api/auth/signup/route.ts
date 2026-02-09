import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email, password, role, fullName } = await request.json()

    // Validate required fields
    if (!email || !password || !role || !fullName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate role
    if (role !== 'student' && role !== 'teacher') {
      return NextResponse.json(
        { error: 'Invalid role. Must be either "student" or "teacher"' },
        { status: 400 }
      )
    }

    // Validate password length
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Sign up the user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role,
          full_name: fullName,
        },
      },
    })

    if (authError) {
      console.error('Auth error:', authError)
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }

    // Check if we have a session (email confirmation disabled) or need admin client
    let userError = null

    if (authData.session) {
      // Email confirmation is disabled - we have a session, use regular client
      // The user is authenticated, so RLS policies will allow the insert
      const { error } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email,
          role,
          full_name: fullName,
        })
      userError = error
    } else {
      // Email confirmation is enabled - no session yet, need admin client
      // Check if service role key is available
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return NextResponse.json(
          {
            error: 'Email confirmation is enabled but service role key is missing. Please add SUPABASE_SERVICE_ROLE_KEY to your .env.local file or disable email confirmation in Supabase dashboard.'
          },
          { status: 500 }
        )
      }

      // Dynamically import admin client only when needed
      const { createClient: createAdminClient } = await import('@supabase/supabase-js')
      const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )

      const { error } = await supabaseAdmin
        .from('users')
        .insert({
          id: authData.user.id,
          email,
          role,
          full_name: fullName,
        })
      userError = error
    }

    if (userError) {
      console.error('User table error:', userError)
      return NextResponse.json(
        { error: 'Failed to create user profile: ' + userError.message },
        { status: 500 }
      )
    }

    // Return success with user data
    return NextResponse.json(
      {
        user: {
          id: authData.user.id,
          email,
          role,
          fullName,
        },
        session: authData.session,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
