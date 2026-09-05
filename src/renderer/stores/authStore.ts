import { create } from 'zustand'
import type { Session, User } from '@supabase/supabase-js'
import { supabase, type HiveProfile } from '../lib/supabase'

interface AuthState {
  ready: boolean
  loading: boolean
  session: Session | null
  user: User | null
  profile: HiveProfile | null
  waitlistWaiting: number
  error: string | null
  info: string | null
  hydrate: () => Promise<void>
  signIn: (email: string, password: string) => Promise<boolean>
  signUp: (email: string, password: string, name: string) => Promise<boolean>
  signOut: () => Promise<void>
  saveProfile: (displayName: string, notify?: boolean) => Promise<boolean>
  acceptSession: (accessToken: string, refreshToken: string) => Promise<boolean>
}

async function ensureProfile(user: User, name?: string): Promise<HiveProfile> {
  const res = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
  if (res.error) throw res.error
  if (res.data) return res.data as HiveProfile
  const email = user.email || ''
  const ins = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      email,
      display_name: name || email.split('@')[0] || 'Hive member',
      status: 'pending',
    })
    .select()
    .single()
  if (ins.error) throw ins.error
  return ins.data as HiveProfile
}

function applyLocalName(profile: HiveProfile | null, user: User | null) {
  const name = profile?.display_name || user?.email?.split('@')[0] || ''
  if (name) {
    try {
      localStorage.setItem('hive_user_name', name)
    } catch {}
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  ready: false,
  loading: false,
  session: null,
  user: null,
  profile: null,
  waitlistWaiting: 0,
  error: null,
  info: null,

  hydrate: async () => {
    try {
      const { data } = await supabase.auth.getSession()
      const session = data.session ?? null
      const user = session?.user ?? null
      let profile: HiveProfile | null = null
      if (user) profile = await ensureProfile(user)
      applyLocalName(profile, user)
      let waitlistWaiting = 0
      try {
        const stats = await supabase.rpc('waitlist_stats')
        waitlistWaiting = Number(stats.data?.waiting || 0)
      } catch {}
      set({ ready: true, session, user, profile, waitlistWaiting, error: null })
    } catch (e: unknown) {
      set({
        ready: true,
        session: null,
        user: null,
        profile: null,
        error: e instanceof Error ? e.message : 'Auth failed',
      })
    }

    supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user ?? null
      let profile: HiveProfile | null = null
      try {
        if (user) profile = await ensureProfile(user)
      } catch {}
      applyLocalName(profile, user)
      set({ session, user, profile })
    })
  },

  signIn: async (email, password) => {
    set({ loading: true, error: null, info: null })
    try {
      const r = await supabase.auth.signInWithPassword({ email, password })
      if (r.error) throw r.error
      const user = r.data.user
      const profile = await ensureProfile(user)
      applyLocalName(profile, user)
      set({ session: r.data.session, user, profile, loading: false })
      return true
    } catch (e: unknown) {
      set({ loading: false, error: e instanceof Error ? e.message : 'Sign in failed' })
      return false
    }
  },

  signUp: async (email, password, name) => {
    set({ loading: true, error: null, info: null })
    try {
      const r = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: name || undefined } },
      })
      if (r.error) throw r.error
      if (!r.data.session) {
        set({
          loading: false,
          info: 'Account created — check your inbox to confirm, then sign in. Same account as the Hive website.',
        })
        return false
      }
      const user = r.data.user
      const profile = await ensureProfile(user, name)
      applyLocalName(profile, user)
      set({ session: r.data.session, user, profile, loading: false })
      return true
    } catch (e: unknown) {
      set({ loading: false, error: e instanceof Error ? e.message : 'Sign up failed' })
      return false
    }
  },

  signOut: async () => {
    try {
      await supabase.auth.signOut()
    } catch {}
    set({ session: null, user: null, profile: null, error: null, info: null })
  },

  saveProfile: async (displayName, notify) => {
    const user = get().user
    if (!user) return false
    try {
      const patch: Record<string, unknown> = { display_name: displayName || 'Hive member' }
      if (typeof notify === 'boolean') patch.notify = notify
      const r = await supabase.from('profiles').update(patch).eq('id', user.id).select().single()
      if (r.error) throw r.error
      const profile = r.data as HiveProfile
      applyLocalName(profile, user)
      set({ profile })
      return true
    } catch (e: unknown) {
      set({ error: e instanceof Error ? e.message : 'Save failed' })
      return false
    }
  },

  acceptSession: async (accessToken, refreshToken) => {
    set({ loading: true, error: null, info: null })
    try {
      const r = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
      if (r.error) throw r.error
      const session = r.data.session
      const user = r.data.user
      if (!session || !user) throw new Error('No session from website login')
      const profile = await ensureProfile(user)
      applyLocalName(profile, user)
      set({ session, user, profile, loading: false, info: null })
      return true
    } catch (e: unknown) {
      set({ loading: false, error: e instanceof Error ? e.message : 'Could not take over website login' })
      return false
    }
  },
}))
