import { describe, expect, it } from 'vitest'

import {
  extractPrefix,
  filterPostsByPeriod,
  filterTablePosts,
  getTableTotalPages,
  paginatePosts,
} from './filters'

const posts = [
  {
    id: '1',
    tanggal: '2026-03-29',
    nomor: 1,
    kode_video: 'PROMO-001',
    views_tiktok: 100,
    views_instagram: 20,
    views_youtube: 10,
  },
  {
    id: '2',
    tanggal: '2026-03-29',
    nomor: 2,
    kode_video: 'PROMO-002',
    views_tiktok: 200,
    views_instagram: 0,
    views_youtube: 0,
  },
  {
    id: '3',
    tanggal: '2026-03-10',
    nomor: 1,
    kode_video: 'EDU-101',
    views_tiktok: 300,
    views_instagram: 40,
    views_youtube: 50,
  },
  {
    id: '4',
    tanggal: '2026-02-20',
    nomor: 3,
    kode_video: 'LIVE-003',
    views_tiktok: 90,
    views_instagram: 10,
    views_youtube: 0,
  },
]

describe('filters', () => {
  it('extracts series prefixes from codes', () => {
    expect(extractPrefix('PROMO-001')).toBe('PROMO')
    expect(extractPrefix('')).toBeNull()
  })

  it('filters posts by the current month and custom range', () => {
    expect(
      filterPostsByPeriod(posts, 'month', {
        now: new Date('2026-03-29T10:00:00'),
      }).map((post) => post.id),
    ).toEqual(['1', '2', '3'])

    expect(
      filterPostsByPeriod(posts, 'custom', {
        from: '2026-03-29',
        to: '2026-03-29',
        now: new Date('2026-03-29T10:00:00'),
      }).map((post) => post.id),
    ).toEqual(['1', '2'])
  })

  it('filters and sorts table posts for the selected day', () => {
    expect(
      filterTablePosts(posts, {
        mode: 'today',
        today: '2026-03-29',
      }).map((post) => post.id),
    ).toEqual(['2', '1'])
  })

  it('paginates filtered posts', () => {
    const filtered = filterTablePosts(posts, { mode: 'all', today: '2026-03-29' })

    expect(getTableTotalPages(filtered, 2)).toBe(2)
    expect(paginatePosts(filtered, 0, 2).map((post) => post.id)).toEqual(['2', '1'])
    expect(paginatePosts(filtered, 1, 2).map((post) => post.id)).toEqual(['3', '4'])
  })
})
