import { FormEvent, useState } from 'react'
import { getCurrentProfile, resendConfirmation, signIn, signUp } from '../data/auth'
import { SCHEMES, hydrateData } from '../data/schemes'

interface Props { onNavigate: (page: string) => void }

export default function Auth({ onNavigate }: Props) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [needsConfirmation, setNeedsConfirmation] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    setNeedsConfirmation(false)
    try {
      const isSignup = mode === 'signup'
      const user = isSignup ? await signUp(email, password, name) : await signIn(email, password)
      if (user) {
        const profile = await getCurrentProfile()
        if (profile) hydrateData({ schemes: SCHEMES, profile })
        onNavigate(profile?.name && profile.age > 0 ? 'dashboard' : 'onboarding')
      } else setMessage('Account created. Check your email to confirm your account, then log in.')
    } catch (error) {
      const rawMessage = error instanceof Error ? error.message : 'Authentication failed.'
      const errorMessage = rawMessage.toLowerCase().includes('rate limit')
        ? 'Supabase has temporarily limited confirmation emails. Wait a few minutes, then try again. If this email was already created, use Log in instead.'
        : rawMessage
      setNeedsConfirmation(errorMessage.toLowerCase().includes('confirm'))
      setMessage(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12" style={{ background: '#FAF7F0', fontFamily: 'Inter, sans-serif' }}>
      <section className="w-full max-w-md rounded-2xl p-8" style={{ background: '#fff', border: '1px solid #E5E0D8' }}>
        <button onClick={() => onNavigate('landing')} className="mb-10" style={{ fontFamily: 'Fraunces, serif', color: '#1E3A5F', fontSize: '1.3rem', fontWeight: 600 }}>
          Scheme<span style={{ color: '#E8A33D' }}>X</span>
        </button>
        <h1 style={{ fontFamily: 'Fraunces, serif', color: '#1E3A5F', fontSize: '2rem', fontWeight: 500 }}>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
        <p className="mt-2 mb-7 text-sm" style={{ color: '#7A8B99' }}>Save your profile, compare schemes, and return to your next steps anytime.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && <input required value={name} onChange={event => setName(event.target.value)} placeholder="Full name" className="w-full rounded-lg px-4 py-3" style={{ border: '1px solid #E5E0D8' }} />}
          <input required type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="Email address" className="w-full rounded-lg px-4 py-3" style={{ border: '1px solid #E5E0D8' }} />
          <input required minLength={6} type="password" value={password} onChange={event => setPassword(event.target.value)} placeholder="Password" className="w-full rounded-lg px-4 py-3" style={{ border: '1px solid #E5E0D8' }} />
          <button disabled={loading} className="w-full rounded-lg py-3 font-semibold" style={{ background: '#1E3A5F', color: '#FAF7F0', opacity: loading ? 0.6 : 1 }}>{loading ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Create account'}</button>
        </form>
        {message && <p className="mt-4 text-sm" style={{ color: '#C7511F' }}>{message}</p>}
        {needsConfirmation && mode === 'login' && (
          <button
            type="button"
            onClick={async () => {
              try {
                await resendConfirmation(email)
                setMessage('A new confirmation email has been sent. Check your inbox and spam folder.')
                setNeedsConfirmation(false)
              } catch (error) {
                setMessage(error instanceof Error ? error.message : 'Could not resend confirmation email.')
              }
            }}
            className="mt-3 text-sm font-semibold"
            style={{ color: '#1E3A5F' }}
          >
            Resend confirmation email
          </button>
        )}
        <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setMessage('') }} className="mt-6 text-sm font-semibold" style={{ color: '#1E3A5F' }}>
          {mode === 'login' ? 'Need an account? Sign up' : 'Already have an account? Log in'}
        </button>
      </section>
    </main>
  )
}
