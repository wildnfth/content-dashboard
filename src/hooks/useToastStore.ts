import { useSyncExternalStore } from 'react'

import { getToastSnapshot, subscribeToToastStore } from '@/services/toast-store'

export function useToastStore() {
  return useSyncExternalStore(subscribeToToastStore, getToastSnapshot, getToastSnapshot)
}
