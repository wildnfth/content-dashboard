import { useSyncExternalStore } from 'react'

import { getAuthSnapshot, subscribeToAuthStore } from '@/services/auth-store'

export function useAuthSession() {
  return useSyncExternalStore(subscribeToAuthStore, getAuthSnapshot, getAuthSnapshot)
}
