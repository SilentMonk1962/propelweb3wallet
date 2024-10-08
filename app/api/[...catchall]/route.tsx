import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    console.log('Catch-all API route hit:', request.url)
    return NextResponse.json({ message: 'Catch-all route' })
}