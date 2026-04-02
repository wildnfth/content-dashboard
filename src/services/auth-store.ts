import type { Session } from '@supabase/supabase-js'

import { supabaseClient, supabaseConfigError } from './supabase'

type AuthStatus = 'loading' | 'ready' | 'error'

interface AuthSnapshot {
  status: AuthStatus
  session: Session | null
  error: string | null
}

let snapshot: AuthSnapshot = {
  status: 'loading',
  session: null,
  error: null,
}

const listeners = new Set<() => void>()
let initialized = false
let initializePromise: Promise<void> | null = null

function emitChange() {
  listeners.forEach((listener) => listener())
}

function updateSnapshot(nextSnapshot: AuthSnapshot) {
  snapshot = nextSnapshot
  emitChange()
}

export function subscribeToAuthStore(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getAuthSnapshot() {
  return snapshot
}

export async function initializeAuthStore() {
  if (initialized) {
    return
  }

  if (initializePromise) {
    return initializePromise
  }

  initializePromise = (async () => {
    if (supabaseConfigError || !supabaseClient) {
      updateSnapshot({
        status: 'error',
        session: null,
        error: supabaseConfigError ?? 'Supabase client could not be initialized.',
      })
      initialized = true
      return
    }

    try {
      const sessionResult = await supabaseClient.auth.getSession()

      updateSnapshot({
        status: 'ready',
        session: sessionResult.data.session,
        error: null,
      })

      supabaseClient.auth.onAuthStateChange((_event, session) => {
        updateSnapshot({
          status: 'ready',
          session,
          error: null,
        })
      })
    }
    catch (error) {
      updateSnapshot({
        status: 'error',
        session: null,
        error: error instanceof Error ? error.message : 'Gagal menghubungkan autentikasi.',
      })
    }

    initialized = true
  })()

  return initializePromise
}
