import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { sendDiscordNotification } from '../../../utils/discordNotification';

const API_ENDPOINT = process.env.API_ENDPOINT!;
const JWT_SECRET = process.env.API_SECRET_KEY!;

if (!API_ENDPOINT || !JWT_SECRET) {
    throw new Error('API_ENDPOINT and JWT_SECRET must be set in environment variables');
}

interface JWTPayload {
    userID: number;
    userName: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    // Development mode responses
    /*
    if (process.env.NODE_ENV === 'development') {
        // Simulate successful transaction
        if (request.headers.get('x-simulate-success') === 'true') {
            return NextResponse.json({ success: true, message: 'Transaction processed successfully' }, { status: 200 });
        }
        // Simulate duplicate transaction
        if (request.headers.get('x-simulate-duplicate') === 'true') {
            return NextResponse.json({ isDuplicate: true, message: 'Duplicate transaction detected' }, { status: 400 });
        }
    }
*/
    try {
        const body = await request.json();
        const { amount, transactionHash, senderAddress } = body;

        // Check for token in header first, then in cookie
        let token = request.headers.get('authorization')?.split(' ')[1];
        if (!token) {
            token = request.cookies.get('auth_token')?.value;
        }

        if (!token) {
            console.error('No token provided in header or cookie');
            return NextResponse.json({ error: 'No token provided' }, { status: 401 });
        }

        let decoded: JWTPayload;
        try {
            decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
        } catch (error) {
            console.error('Failed to decode JWT:', error);
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        //console.log('Decoded JWT:', decoded);

        const payload = {
            userId: decoded.userID,
            amount,
            transactionHash,
            senderAddress,
        };

        console.log('Sending payload to API:', payload);

        // Send API request with the JWT in the Authorization header
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            console.error('API request failed:', response.statusText);
            throw new Error('API request failed');
        }

        const data = await response.json();
        //console.log('API response:', data);

        // Check for duplicate entries
        if (data.isDuplicate) {
            console.log('Duplicate transaction detected');
            return NextResponse.json({ isDuplicate: true }, { status: 409 });
        }

        console.log('Transaction processed successfully');
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in notify-transaction:', error);
        await sendDiscordNotification({
            userId: 0,
            service: 'USD Deposit NextJS',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            userEmail: 'unknown@example.com',
        });
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}