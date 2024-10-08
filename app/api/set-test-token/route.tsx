import { NextResponse } from 'next/server'
import * as jose from 'jose'

const API_SECRET_KEY = process.env.API_SECRET_KEY!

export async function GET() {
    if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json({ error: 'This route is only available in development mode' }, { status: 403 })
    }

    if (!API_SECRET_KEY) {
        return NextResponse.json({ error: 'API_SECRET_KEY is not defined' }, { status: 500 })
    }

    const secret = new TextEncoder().encode(API_SECRET_KEY)

    const token = await new jose.SignJWT({ "userID": 69, "userName": "Abhishek Singh Bhilware" })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('5m')
        .sign(secret)

    console.log('Generated token:', token)

    const response = NextResponse.json({ success: true, token })
    response.cookies.set('auth_token', token, {
        httpOnly: true,
        maxAge: 5 * 60, // 5 minutes in seconds
        sameSite: 'strict',
        path: '/' // Ensure the cookie is available for all paths
    })

    return response
}