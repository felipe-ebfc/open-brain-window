'use client'

import { signIn, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, Suspense } from 'react'

function SignInContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const callbackUrl = searchParams.get('callbackUrl') || '/'

  useEffect(() => {
    if (status === 'authenticated') {
      router.push(callbackUrl)
    }
  }, [status, router, callbackUrl])

  if (status === 'loading') {
    return (
      <div style={{
        minHeight: '100dvh',
        background: '#0a0a0a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          border: '3px solid #2a2a2a',
          borderTop: '3px solid #00b8a9',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: '#0a0a0a',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 24px',
    }}>
      {/* Logo */}
      <div style={{
        width: 64,
        height: 64,
        borderRadius: 18,
        background: 'linear-gradient(135deg, #00b8a9 0%, #4a9eff 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 32,
        marginBottom: 24,
      }}>
        🧠
      </div>

      <h1 style={{
        fontSize: 24,
        fontWeight: 800,
        color: '#f0f0f0',
        letterSpacing: '-0.03em',
        margin: '0 0 8px',
        textAlign: 'center',
      }}>
        Open Brain Window
      </h1>
      <p style={{
        fontSize: 14,
        color: '#5a5a5a',
        margin: '0 0 40px',
        textAlign: 'center',
        lineHeight: 1.5,
      }}>
        Personal OS — restricted access
      </p>

      {/* Error message */}
      {error && (
        <div style={{
          background: 'rgba(232, 64, 64, 0.1)',
          border: '1px solid rgba(232, 64, 64, 0.3)',
          borderRadius: 10,
          padding: '12px 16px',
          marginBottom: 24,
          maxWidth: 320,
          width: '100%',
          textAlign: 'center',
        }}>
          <p style={{ margin: 0, fontSize: 13, color: '#e84040' }}>
            {error === 'AccessDenied'
              ? 'Access denied. This app is restricted to authorized users only.'
              : 'Authentication failed. Please try again.'}
          </p>
        </div>
      )}

      {/* Sign in card */}
      <div style={{
        background: '#1e1e1e',
        border: '1px solid #2a2a2a',
        borderRadius: 16,
        padding: '32px 28px',
        maxWidth: 340,
        width: '100%',
      }}>
        <p style={{
          fontSize: 13,
          color: '#a0a0a0',
          margin: '0 0 24px',
          textAlign: 'center',
          lineHeight: 1.6,
        }}>
          Sign in with your authorized Google account to continue.
        </p>

        <button
          onClick={() => signIn('google', { callbackUrl })}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            padding: '14px 20px',
            borderRadius: 10,
            border: '1px solid #3a3a3a',
            background: '#2a2a2a',
            color: '#f0f0f0',
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s',
            letterSpacing: '-0.01em',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = '#333'
            ;(e.currentTarget as HTMLButtonElement).style.borderColor = '#4a4a4a'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = '#2a2a2a'
            ;(e.currentTarget as HTMLButtonElement).style.borderColor = '#3a3a3a'
          }}
        >
          {/* Google icon */}
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Sign in with Google
        </button>
      </div>

      <p style={{
        marginTop: 24,
        fontSize: 11,
        color: '#3a3a3a',
        textAlign: 'center',
      }}>
        Open Brain Window · Private
      </p>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100dvh',
        background: '#0a0a0a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#5a5a5a',
        fontSize: 14,
      }}>
        Loading…
      </div>
    }>
      <SignInContent />
    </Suspense>
  )
}
