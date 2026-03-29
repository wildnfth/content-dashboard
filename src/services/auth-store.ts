import type { Session } from '@supabase/supabase-js'

import { supabaseClient } from './supabase'

type AuthStatus = 'loading' | 'ready'

interface AuthSnapshot {
  status: AuthStatus
  session: Session | null
}

let snapshot: AuthSnapshot = {
  status: 'loading',
  session: null,
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
    const sessionResult = await supabaseClient.auth.getSession()

    updateSnapshot({
      status: 'ready',
      session: sessionResult.data.session,
    })

    supabaseClient.auth.onAuthStateChange((_event, session) => {
      updateSnapshot({
        status: 'ready',
        session,
      })
    })

    initialized = true
  })()

  return initializePromise
}
