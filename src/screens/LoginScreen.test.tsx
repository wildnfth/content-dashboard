import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { LoginScreen } from './LoginScreen'

const signInWithPasswordMock = vi.fn()

vi.mock('@/services/supabase', () => ({
  supabaseConfigError: null,
  supabaseClient: {
    auth: {
      signInWithPassword: (...args: unknown[]) => signInWithPasswordMock(...args),
    },
  },
}))

describe('LoginScreen', () => {
  it('locks body scroll while the login screen is mounted', async () => {
    const { unmount } = render(<LoginScreen />)

    await waitFor(() => {
      expect(document.body).toHaveAttribute('data-scroll-locked', 'true')
    })

    unmount()

    await waitFor(() => {
      expect(document.body).not.toHaveAttribute('data-scroll-locked')
    })
  })

  it('moves focus to the next field when Enter is pressed', () => {
    render(<LoginScreen />)

    const usernameField = screen.getByPlaceholderText('username kamu')
    const passwordField = screen.getByPlaceholderText('••••••••')

    usernameField.focus()
    fireEvent.keyDown(usernameField, { key: 'Enter', code: 'Enter' })

    expect(document.activeElement).toBe(passwordField)
  })

  it('maps username to proton email when submitting login', async () => {
    signInWithPasswordMock.mockResolvedValue({ error: null })

    render(<LoginScreen />)

    fireEvent.change(screen.getByPlaceholderText('username kamu'), {
      target: { value: 'Lia Gold' },
    })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'secret-pass' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Masuk ke dashboard' }))

    await waitFor(() => {
      expect(signInWithPasswordMock).toHaveBeenCalledWith({
        email: 'lia_gold@proton.me',
        password: 'secret-pass',
      })
    })
  })
})
