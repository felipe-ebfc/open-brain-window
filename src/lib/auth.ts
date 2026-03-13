import type { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

const ALLOWED_EMAIL = 'felipe@ebfc.ai'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      // Hard allowlist — only felipe@ebfc.ai gets in
      return user.email === ALLOWED_EMAIL
    },
    async session({ session, token }) {
      return session
    },
    async jwt({ token, user }) {
      return token
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin',
  },
  session: {
    strategy: 'jwt',
  },
}
