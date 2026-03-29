import { dismissToast } from '@/services/toast-store'
import { useToastStore } from '@/hooks/useToastStore'

import styles from './ToastViewport.module.css'

export function ToastViewport() {
  const { items } = useToastStore()

  return (
    <aside className={styles.viewport} aria-live="polite" aria-atomic="true">
      {items.map((item) => (
        <div key={item.id} className={`${styles.toast} ${item.tone === 'err' ? styles.err : styles.ok}`}>
          <div className={styles.icon}>{item.tone === 'err' ? '!' : 'OK'}</div>
          <div className={styles.content}>
            <p>{item.message}</p>
          </div>
          <button className={styles.close} onClick={() => dismissToast(item.id)} type="button" aria-label="Tutup toast">
            ×
          </button>
        </div>
      ))}
    </aside>
  )
}
