import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { PostFormSheet } from './PostFormSheet'

const pushToastMock = vi.fn()

vi.mock('@/services/toast-store', () => ({
  pushToast: (...args: unknown[]) => pushToastMock(...args),
}))

vi.mock('@/services/supabase-posts', () => ({
  supabasePostsService: {
    create: vi.fn(),
    update: vi.fn(),
    getHighestNomorByDate: vi.fn(),
  },
}))

describe('PostFormSheet', () => {
  it('locks body scroll only while the sheet is open', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })

    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <PostFormSheet open editingPost={null} existingPosts={[]} onClose={vi.fn()} />
      </QueryClientProvider>,
    )

    await waitFor(() => {
      expect(document.body).toHaveAttribute('data-scroll-locked', 'true')
    })

    rerender(
      <QueryClientProvider client={queryClient}>
        <PostFormSheet open={false} editingPost={null} existingPosts={[]} onClose={vi.fn()} />
      </QueryClientProvider>,
    )

    await waitFor(() => {
      expect(document.body).not.toHaveAttribute('data-scroll-locked')
    })
  })

  it('rejects duplicate kode video before saving', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })

    render(
      <QueryClientProvider client={queryClient}>
        <PostFormSheet
          open
          editingPost={null}
          existingPosts={[
            {
              id: '1',
              tanggal: '2026-03-29',
              nomor: 1,
              kode_video: 'PROMO-001',
            },
          ]}
          onClose={vi.fn()}
        />
      </QueryClientProvider>,
    )

    fireEvent.change(screen.getByPlaceholderText('PROMO-001'), {
      target: { value: 'PROMO-001' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Simpan post' }))

    await waitFor(() => {
      expect(pushToastMock).toHaveBeenCalledWith('Kode "PROMO-001" sudah dipakai.', 'err')
    })
  })
})
