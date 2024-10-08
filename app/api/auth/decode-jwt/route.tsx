import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';

const JWT_SECRET = process.env.API_SECRET_KEY!;

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET must be set in environment variables');
}

export async function GET(request: NextRequest) {
    let token = request.headers.get('authorization')?.split(' ')[1];

    if (!token) {
        token = request.cookies.get('auth_token')?.value;
    }

    console.log('Authorization Header:', request.headers.get('authorization'));
    console.log('Auth Token Cookie:', request.cookies.get('auth_token')?.value);
    console.log('Token:', token);
    console.log('Secret:', JWT_SECRET);

    if (!token) {
        return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    try {
        const secret = new TextEncoder().encode(JWT_SECRET);

        const { payload } = await jose.jwtVerify(token, secret, {
            algorithms: ['HS256'],
        });

        console.log('Decoded payload:', payload);

        const userInfo = {
            userId: payload.userID,
            userName: payload.userName
        };

        const response = NextResponse.json({ success: true, payload: userInfo });

        // Set both cookies with consistent settings
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict' as const,
            path: '/',
            maxAge: 300 //so it will expire in 5 mins (5*60)
        };

        response.cookies.set('auth_token', token, cookieOptions);
        response.cookies.set('user_info', JSON.stringify(userInfo), cookieOptions);

        return response;
    } catch (error) {
        console.error('Failed to decode JWT:', error);
        if (error instanceof jose.errors.JOSEError) {
            console.error('JOSE Error Code:', error.code);
            console.error('JOSE Error Message:', error.message);
        }
        return NextResponse.json({ error: 'Invalid token', details: error }, { status: 401 });
    }
}