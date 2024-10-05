import { NextResponse } from 'next/server'
import crypto from 'crypto'
import axios from 'axios'

const API_ENDPOINT = process.env.API_ENDPOINT
const API_SECRET_KEY = process.env.API_SECRET_KEY

if (!API_ENDPOINT || !API_SECRET_KEY) {
    throw new Error('API_ENDPOINT and API_SECRET_KEY must be set in environment variables')
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { amount, transactionHash, senderAddress } = body

        const apiData = {
            amount,
            transactionHash,
            datetime: new Date().toISOString(),
            senderAddress,
        }

        // Create HMAC signature
        const messageBody = JSON.stringify(apiData)
        const hmac = crypto.createHmac('sha256', API_SECRET_KEY).update(messageBody).digest('hex')

        // Send API request with the HMAC hash in the headers
        const response = await axios.post(
            API_ENDPOINT,
            apiData,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Signature': hmac,
                },
            }
        )

        if (response.status !== 200) {
            throw new Error('API request failed')
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error in notify-transaction:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}