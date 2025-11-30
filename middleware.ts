import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// PoC credentials - hardcoded for simplicity
const USERNAME = process.env.USERNAME;
const PASSWORD = process.env.PASSWORD;

export function middleware(request: NextRequest) {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');

    // If no authorization header, request authentication
    if (!authHeader) {
        return new NextResponse('Authentication required', {
            status: 401,
            headers: {
                'WWW-Authenticate': 'Basic realm="Secure Area"',
            },
        });
    }

    // Parse the authorization header
    const auth = authHeader.split(' ')[1];
    const [username, password] = Buffer.from(auth, 'base64').toString().split(':');

    // Validate credentials
    if (username === USERNAME && password === PASSWORD) {
        // Authentication successful, allow the request to proceed
        return NextResponse.next();
    }

    // Invalid credentials
    return new NextResponse('Invalid credentials', {
        status: 401,
        headers: {
            'WWW-Authenticate': 'Basic realm="Secure Area"',
        },
    });
}

// Configure which routes to protect
// This will protect all routes except the Telegram webhook
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - api/telegram (Telegram webhook endpoint)
         */
        '/((?!_next/static|_next/image|favicon.ico|api/telegram).*)',
    ],
};
