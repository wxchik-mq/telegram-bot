import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// PoC credentials - hardcoded for simplicity
const USERNAME = process.env.USERNAME;
const PASSWORD = process.env.PASSWORD;

export function middleware(request: NextRequest) {
    // Skip authentication for Telegram webhook
    const pathname = request.nextUrl.pathname;
    if (pathname.startsWith('/api/telegram')) {
        return NextResponse.next();
    }

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
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Note: /api/telegram is excluded in the middleware function itself
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
