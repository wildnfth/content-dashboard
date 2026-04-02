import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import App from './App'

const useAuthSessionMock = vi.fn()

vi.mock('@/hooks/useAuthSession', () => ({
  useAuthSession: () => useAuthSessionMock(),
}))

vi.mock('@/app/AppShell', () => ({
  AppShell: () => <div>Protected shell</div>,
}))

vi.mock('@/screens/LoginScreen', () => ({
  LoginScreen: () => <div>Login route</div>,
}))

vi.mock('@/screens/OperasionalScreen', () => ({
  OperasionalScreen: () => <div>Operasional route</div>,
}))

vi.mock('@/screens/InsightScreen', () => ({
  InsightScreen: () => <div>Insight route</div>,
}))

vi.mock('@/components/ToastViewport', () => ({
  ToastViewport: () => null,
}))

function renderApp(initialEntry: string) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('App routing', () => {
  it('shows startup error when auth initialization fails', async () => {
    useAuthSessionMock.mockReturnValue({
      status: 'error',
      session: null,
      error: 'Supabase environment variables are missing.',
    })

    renderApp('/')

    expect(await screen.findByText('Dashboard belum bisa dibuka.')).toBeInTheDocument()
    expect(screen.getByText('Supabase environment variables are missing.')).toBeInTheDocument()
  })

  it('redirects guests away from protected routes', async () => {
    useAuthSessionMock.mockReturnValue({
      status: 'ready',
      session: null,
      error: null,
    })

    renderApp('/app/operasional')

    expect(await screen.findByText('Login route')).toBeInTheDocument()
  })

  it('redirects authenticated users away from login', async () => {
    useAuthSessionMock.mockReturnValue({
      status: 'ready',
      session: { user: { email: 'lia@proton.me', user_metadata: {} } },
      error: null,
    })

    renderApp('/login')

    expect(await screen.findByText('Protected shell')).toBeInTheDocument()
  })
})
