import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(process.env.API_SECRET_KEY!)

export async function verifyJWT(token: string) {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET, {
            algorithms: ['HS256']
        })

        //console.log('Decoded JWT:', JSON.stringify(payload, null, 2))
        //console.log('Protected Header:', JSON.stringify(protectedHeader, null, 2))

        const now = Math.floor(Date.now() / 1000)

        if (typeof payload.exp === 'number' && payload.exp < now) {
            console.log('Token has expired. Current time:', now, 'Expiration:', payload.exp)
            return { valid: false, error: 'Token has expired' }
        }

        return { valid: true, payload }
    } catch (error) {
        console.error('JWT verification error:', error)
        return { valid: false, error: error instanceof Error ? error.message : String(error) }
    }
}