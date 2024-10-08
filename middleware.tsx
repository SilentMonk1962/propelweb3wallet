import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyJWT } from './app/lib/auth'
import { ratelimit } from './app/lib/ratelimit'

const isDevelopment = process.env.NODE_ENV === 'development'

export async function middleware(request: NextRequest) {
    //console.log('Middleware called for path:', request.nextUrl.pathname)

    // Apply rate limiting to all routes, with different logic for development
    const ip = isDevelopment ? 'development' : (request.ip ?? '127.0.0.1')
    //console.log('Rate limiting for IP:', ip)

    try {
        if (!isDevelopment) {
            const { success, limit, reset, remaining } = await ratelimit.limit(ip)
            if (!success) {
                console.log('Rate limit exceeded for IP:', ip)
                return new NextResponse('Too Many Requests', {
                    status: 429,
                    headers: {
                        'X-RateLimit-Limit': limit.toString(),
                        'X-RateLimit-Remaining': remaining.toString(),
                        'X-RateLimit-Reset': reset.toString(),
                    },
                })
            }
        } else {
            console.log('Rate limiting bypassed in development mode')
        }
    } catch (error) {
        console.error('Rate limiting error:', error)
    }

    // Skip authentication check for the set-test-token endpoint
    if (request.nextUrl.pathname === '/api/set-test-token') {
        //console.log('Skipping auth check for /api/set-test-token')
        return NextResponse.next()
    }

    // JWT verification for all other routes
    let token: string | undefined = request.cookies.get('auth_token')?.value
    let tokenSource: 'cookie' | 'header' = 'cookie'

    // If token is not in cookie, check the x-signature header
    if (!token) {
        const headerToken = request.headers.get('x-signature')
        if (headerToken) {
            token = headerToken
            tokenSource = 'header'
        }
    }

    if (!token) {
        console.log('No token found, returning 401 Unauthorized')
        return new NextResponse('Unauthorized', { status: 401 })
    }

    console.log('Token found:', token.substring(0, 20) + '...')

    try {
        console.log('Verifying JWT')
        const { valid, payload, error } = await verifyJWT(token)
        if (!valid) {
            console.log('Invalid JWT:', error)
            return new NextResponse('Unauthorized', { status: 401 })
        }

        //console.log('JWT verified successfully. Payload:', JSON.stringify(payload, null, 2))

        // If token was found in header, save it to cookie
        if (tokenSource === 'header') {
            //console.log('Saving token from header to cookie')
            const response = NextResponse.next()
            response.cookies.set('auth_token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 60 * 60 * 24 * 7, // 1 week
            })
            return response
        }

        return NextResponse.next()
    } catch (error) {
        console.error('JWT verification failed:', error)
        return new NextResponse('Unauthorized', { status: 401 })
    }
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
}