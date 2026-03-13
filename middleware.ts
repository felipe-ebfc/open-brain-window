export { default } from 'next-auth/middleware'

export const config = {
  // Protect all routes except public assets and auth routes
  matcher: [
    '/((?!api/auth|auth/signin|_next/static|_next/image|favicon.ico|manifest.json|.*\\.svg|.*\\.png|.*\\.ico).*)',
  ],
}
