import { NavLink, Outlet } from 'react-router-dom'
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'

import { supabaseClient } from '@/services/supabase'

import styles from './AppShell.module.css'

export function AppShell() {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <h1 className={styles.brandTitle}>Toko Mas Lia</h1>
        <button
          type="button"
          className={styles.logout}
          onClick={() => supabaseClient.auth.signOut()}
          aria-label="Keluar"
          title="Keluar"
        >
          <ArrowRightOnRectangleIcon aria-hidden="true" />
        </button>
      </header>

      <main className={styles.main}>
        <Outlet />
      </main>

      <nav className={styles.bottomNav} aria-label="Navigasi mobile">
        <NavLink
          to="/app/operasional"
          className={({ isActive }) => `${styles.bottomLink} ${isActive ? styles.bottomLinkActive : ''}`}
        >
          <span>Operasional</span>
        </NavLink>
        <NavLink
          to="/app/insight"
          className={({ isActive }) => `${styles.bottomLink} ${isActive ? styles.bottomLinkActive : ''}`}
        >
          <span>Insight</span>
        </NavLink>
      </nav>
    </div>
  )
}
