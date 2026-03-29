export type ToastTone = 'ok' | 'err'

export interface ToastItem {
  id: string
  message: string
  tone: ToastTone
}

interface ToastSnapshot {
  items: ToastItem[]
}

let toastSnapshot: ToastSnapshot = {
  items: [],
}

const listeners = new Set<() => void>()

function emitChange() {
  listeners.forEach((listener) => listener())
}

function updateToastSnapshot(nextSnapshot: ToastSnapshot) {
  toastSnapshot = nextSnapshot
  emitChange()
}

export function subscribeToToastStore(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getToastSnapshot() {
  return toastSnapshot
}

export function pushToast(message: string, tone: ToastTone = 'ok') {
  const id = crypto.randomUUID()
  const nextItem: ToastItem = { id, message, tone }

  updateToastSnapshot({
    items: [...toastSnapshot.items, nextItem],
  })

  window.setTimeout(() => {
    dismissToast(id)
  }, 3200)
}

export function dismissToast(id: string) {
  updateToastSnapshot({
    items: toastSnapshot.items.filter((item) => item.id !== id),
  })
}
