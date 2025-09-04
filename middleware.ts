import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import authConfig from './auth.config';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;
  const isAuthed = !!req.auth;

  const isProtected =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/clock') ||
    pathname.startsWith('/inventory') ||
    pathname.startsWith('/admin') ||
    // any pages nested under the route group (protected) ultimately resolve without parentheses:
    // so match on their public path (above) instead of "(protected)" itself
    false;

  // 1) Gate protected pages
  if (!isAuthed && isProtected) {
    const signin = new URL('/signin', nextUrl);
    // optional: carry returnTo
    signin.searchParams.set('redirect', pathname);
    return NextResponse.redirect(signin);
  }

  // 2) If already signed in and visiting /signin, send to /dashboard
  if (isAuthed && pathname === '/signin') {
    return NextResponse.redirect(new URL('/dashboard', nextUrl));
  }

  // otherwise, allow
  return NextResponse.next();
});

// Only run on these paths (keeps assets/_next/api fast)
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/clock/:path*',
    '/inventory/:path*',
    '/admin/:path*',
    '/signin' // so we can bounce signed-in users away from signin
  ]
};
