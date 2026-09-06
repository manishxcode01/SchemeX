import type { User } from '@supabase/supabase-js'
import { fetchBootstrapData, localRequest, saveLocalProfile, supabase } from './api'
import { EMPTY_PROFILE, type UserProfile } from './schemes'

export async function signIn(email: string, password: string) {
  if (!supabase) {
    const user = await localRequest<{ id: string; email: string; name: string }>('/api/auth/login', 'POST', { email, password })
    localStorage.setItem('schemex-local-user', JSON.stringify(user))
    return user as unknown as User
  }
  const result = await supabase.auth.signInWithPassword({ email, password })
  if (result.error) throw result.error
  return result.data.user
}

export async function signUp(email: string, password: string, name: string) {
  if (!supabase) {
    const user = await localRequest<{ id: string; email: string; name: string }>('/api/auth/signup', 'POST', { email, password, name })
    localStorage.setItem('schemex-local-user', JSON.stringify(user))
    await saveLocalProfile({ ...EMPTY_PROFILE, name })
    return user as unknown as User
  }
  const result = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  })
  if (result.error) throw result.error
  if (result.data.user) {
    if (!result.data.session) return null
    const { error: profileError } = await supabase.from('profiles').upsert({ id: result.data.user.id, payload: { ...EMPTY_PROFILE, name }, updated_at: new Date().toISOString() })
    if (profileError) throw profileError
  }
  return result.data.user
}

export async function saveProfile(payload: Record<string, unknown>): Promise<UserProfile | undefined> {
  if (!supabase) return saveLocalProfile(payload as UserProfile)
  const user = await getCurrentUser()
  if (!user) return
  const { error } = await supabase.from('profiles').upsert({ id: user.id, payload, updated_at: new Date().toISOString() })
  if (error) throw error
  return payload as UserProfile
}

export async function getCurrentUser(): Promise<User | null> {
  if (!supabase) {
    const stored = localStorage.getItem('schemex-local-user')
    return stored ? JSON.parse(stored) as User : null
  }
  const { data } = await supabase.auth.getUser()
  return data.user
}

export async function signOut() {
  if (supabase) await supabase.auth.signOut()
  else localStorage.removeItem('schemex-local-user')
}

export async function isCurrentUserAdmin(): Promise<boolean> {
  if (!supabase) return (await getCurrentUser())?.email === 'admin@schemex.local'
  const user = await getCurrentUser()
  if (!user) return false
  const { data, error } = await supabase.from('user_roles').select('role').eq('user_id', user.id).maybeSingle()
  return !error && data?.role === 'admin'
}

export async function getCurrentProfile(): Promise<UserProfile | null> {
  if (!supabase) return (await fetchBootstrapData()).profile
  const user = await getCurrentUser()
  if (!user) return null
  const { data, error } = await supabase.from('profiles').select('payload').eq('id', user.id).maybeSingle()
  if (error) throw error
  return (data?.payload as UserProfile | undefined) ?? { ...EMPTY_PROFILE, name: String(user.user_metadata?.name ?? '') }
}

export async function resendConfirmation(email: string) {
  if (!supabase) throw new Error('Supabase is not configured.')
  const result = await supabase.auth.resend({ type: 'signup', email })
  if (result.error) throw result.error
}
