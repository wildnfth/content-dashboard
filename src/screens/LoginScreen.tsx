import { useState } from 'react'
import type { FormEvent } from 'react'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'

import { focusNextFieldOrSubmit } from '@/lib/focus'
import { useBodyScrollLockRef } from '@/hooks/useBodyScrollLock'
import { usernameToEmail } from '@/lib/formatters'
import { supabaseClient } from '@/services/supabase'

import styles from './LoginScreen.module.css'

export function LoginScreen() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const lockBodyScrollRef = useBodyScrollLockRef<HTMLElement>()

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage('')

    if (!username.trim() || !password) {
      setErrorMessage('Username dan password wajib diisi.')
      return
    }

    setIsSubmitting(true)

    const email = usernameToEmail(username.trim())
    const result = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    })

    setIsSubmitting(false)

    if (result.error) {
      setErrorMessage(`${result.error.message} (${email})`)
    }
  }

  return (
    <section ref={lockBodyScrollRef} className={styles.page} data-screen="login">
      <form
        className={styles.card}
        onSubmit={handleSubmit}
        onKeyDown={(event) => focusNextFieldOrSubmit(event, () => event.currentTarget.requestSubmit())}
      >
        <div className={styles.cardHeader}>
          <h2>
            Dashboard Konten
            <br />
            Toko Mas Lia
          </h2>
        </div>

        <label className={styles.field}>
          <span>Username</span>
          <input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="username kamu" autoComplete="username" />
        </label>

        <label className={styles.field}>
          <span>Password</span>
          <div className={styles.passwordField}>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              type={isPasswordVisible ? 'text' : 'password'}
              autoComplete="current-password"
            />
            <button
              type="button"
              className={styles.passwordToggle}
              onClick={() => setIsPasswordVisible((value) => !value)}
              aria-label={isPasswordVisible ? 'Sembunyikan password' : 'Tampilkan password'}
              title={isPasswordVisible ? 'Sembunyikan password' : 'Tampilkan password'}
            >
              {isPasswordVisible ? <EyeSlashIcon className={styles.passwordIcon} aria-hidden="true" /> : <EyeIcon className={styles.passwordIcon} aria-hidden="true" />}
            </button>
          </div>
        </label>

        {errorMessage ? <p className={styles.error}>{errorMessage}</p> : null}

        <button type="submit" className={styles.primaryAction} disabled={isSubmitting}>
          {isSubmitting ? 'Memuat...' : 'Masuk ke dashboard'}
        </button>
      </form>
    </section>
  )
}
