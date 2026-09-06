import { EMPTY_PROFILE, type Scheme, type UserProfile } from './schemes'
import { createClient } from '@supabase/supabase-js'

export interface BootstrapData {
  schemes: Scheme[]
  profile: UserProfile
}

export interface PlatformStats {
  users: number
  schemes: number
  eligibleMatches: number
  nearMissMatches: number
}

export const supabase = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
  ? createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)
  : null

export const isSupabaseConfigured = Boolean(supabase)

export async function fetchBootstrapData(): Promise<BootstrapData> {
  if (supabase) {
    const { data: userData } = await supabase.auth.getUser()
    const profileQuery = userData.user
      ? supabase.from('profiles').select('payload').eq('id', userData.user.id).maybeSingle()
      : Promise.resolve({ data: null, error: null })
    const [{ data: schemes, error: schemesError }, { data: profile, error: profileError }] = await Promise.all([
      supabase.from('schemes').select('payload').eq('published', true).order('id'),
      profileQuery,
    ])
    if (!schemesError && !profileError) {
      return {
        schemes: schemes?.map(row => row.payload as Scheme) ?? [],
        profile: (profile?.payload as UserProfile) ?? EMPTY_PROFILE,
      }
    }
  }
  return fetchLocalBootstrap()
}

async function fetchLocalBootstrap(): Promise<BootstrapData> {
  const response = await fetch('/api/bootstrap')
  if (!response.ok) throw new Error(`API request failed: ${response.status}`)
  return response.json() as Promise<BootstrapData>
}

export async function fetchPlatformStats(): Promise<PlatformStats> {
  const response = await fetch('/api/stats')
  if (!response.ok) throw new Error(`Stats request failed: ${response.status}`)
  return response.json() as Promise<PlatformStats>
}

function localUserHeaders() {
  const stored = localStorage.getItem('schemex-local-user')
  const user = stored ? JSON.parse(stored) as { id?: string } : null
  return user?.id ? { 'X-Local-User': user.id } as Record<string, string> : {} as Record<string, string>
}

export async function localRequest<T>(url: string, method: string, body?: unknown): Promise<T> {
  const response = await fetch(url, {
    method,
    headers: { ...localUserHeaders(), ...(body ? { 'Content-Type': 'application/json' } : {}) } as Record<string, string>,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!response.ok) throw new Error(`API request failed: ${response.status}`)
  return response.status === 204 ? undefined as T : response.json() as Promise<T>
}

export function saveLocalProfile(profile: UserProfile) {
  return localRequest<UserProfile>('/api/profile', 'PUT', profile)
}

export async function createScheme(scheme: Scheme) {
  if (!supabase) return localRequest<Scheme>('/api/schemes', 'POST', scheme)
  const { error } = await supabase.from('schemes').insert({ id: scheme.id, payload: scheme, published: true })
  if (error) throw error
}

export async function importSchemes(schemes: Scheme[]) {
  if (!supabase) return localRequest<{ imported: number }>('/api/schemes/import', 'POST', schemes)
  const { error } = await supabase.from('schemes').upsert(
    schemes.map(scheme => ({ id: scheme.id, payload: scheme, published: true, updated_at: new Date().toISOString() })),
    { onConflict: 'id' },
  )
  if (error) throw error
}

export async function updateScheme(id: string, changes: Partial<Scheme>) {
  if (!supabase) return localRequest<Scheme>(`/api/schemes/${id}`, 'PUT', changes)
  const { data, error: readError } = await supabase.from('schemes').select('payload').eq('id', id).single()
  if (readError) throw readError
  const { error } = await supabase.from('schemes').update({ payload: { ...(data.payload as Scheme), ...changes }, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) throw error
}

export async function archiveScheme(id: string) {
  if (!supabase) return localRequest<void>(`/api/schemes/${id}`, 'DELETE')
  const { error } = await supabase.from('schemes').update({ published: false, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) throw error
}
