import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protected routes
  const protectedPaths = ['/dashboard', '/room'];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  if (isProtected) {
    const spotifyUserId = request.cookies.get('spotify_user_id')?.value;
    if (!spotifyUserId) {
      const loginUrl = new URL('/', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/room/:path*'],
};
