import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { OperasionalScreen } from './OperasionalScreen'

vi.mock('@/services/supabase-posts', () => ({
  supabasePostsService: {
    list: vi.fn().mockResolvedValue([
      {
        id: '1',
        tanggal: '2026-03-29',
        nomor: 1,
        kode_video: 'PROMO-001',
        jam_upload: '08:00',
        views_tiktok: 100,
        views_instagram: 0,
        views_youtube: 0,
        link_tiktok: 'https://tiktok.com/1',
        link_instagram: '',
        link_youtube: '',
      },
      {
        id: '2',
        tanggal: '2026-03-28',
        nomor: 1,
        kode_video: 'EDU-001',
        jam_upload: '09:00',
        views_tiktok: 50,
        views_instagram: 10,
        views_youtube: 5,
        link_tiktok: 'https://tiktok.com/2',
        link_instagram: 'https://instagram.com/2',
        link_youtube: 'https://youtube.com/2',
      },
    ]),
    remove: vi.fn(),
    getHighestNomorByDate: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}))

vi.mock('@/services/toast-store', () => ({
  pushToast: vi.fn(),
}))

describe('OperasionalScreen', () => {
  it('shows incomplete hints and can filter to todays posts', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })

    render(
      <QueryClientProvider client={queryClient}>
        <OperasionalScreen />
      </QueryClientProvider>,
    )

    await waitFor(() => {
      expect(screen.getAllByText('PROMO-001').length).toBeGreaterThan(0)
    })

    expect(screen.getAllByText(/Belum lengkap:/).length).toBeGreaterThan(0)

    fireEvent.click(screen.getByRole('button', { name: 'Hari ini' }))

    await waitFor(() => {
      expect(screen.queryAllByText('EDU-001')).toHaveLength(0)
    })
  })
})
