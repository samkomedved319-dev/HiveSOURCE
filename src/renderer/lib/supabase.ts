import { createClient } from '@supabase/supabase-js'

/** Same HiveWEB project as https://hivetools.pro/hive/ */
export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://nqkmnmwbmikbgopwkvse.supabase.co'

export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xa21ubXdibWlrYmdvcHdrdnNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0NjMyOTksImV4cCI6MjEwNDAzOTI5OX0.5hu89H56db0OxrEIJUIXSn7O_qP9f4yML_W0Vy8ATMU'

export const WEB_APP_URL = 'https://hivetools.pro/hive'

export type HiveProfile = {
  id: string
  email: string | null
  display_name: string | null
  status: 'pending' | 'approved' | 'denied'
  customer_number: number | null
  notify: boolean
  created_at: string
  is_admin?: boolean
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storageKey: 'hive-web-auth',
  },
})
