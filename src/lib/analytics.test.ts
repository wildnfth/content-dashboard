import { describe, expect, it } from 'vitest'

import {
  buildBreakdownItems,
  buildPlatformTotals,
  buildTopVideos,
  buildTrendSeries,
  getOperationalSummary,
  getPostTotalViews,
  getStatusHints,
  isPostIncomplete,
} from './analytics'

const posts = [
  {
    id: '1',
    tanggal: '2026-03-29',
    nomor: 1,
    kode_video: 'PROMO-001',
    views_tiktok: 100,
    views_instagram: 50,
    views_youtube: 0,
    link_tiktok: 'https://tiktok.com/1',
    link_instagram: 'https://instagram.com/1',
    link_youtube: '',
  },
  {
    id: '2',
    tanggal: '2026-03-29',
    nomor: 2,
    kode_video: 'PROMO-002',
    views_tiktok: 300,
    views_instagram: 20,
    views_youtube: 10,
    link_tiktok: 'https://tiktok.com/2',
    link_instagram: 'https://instagram.com/2',
    link_youtube: 'https://youtube.com/2',
  },
  {
    id: '3',
    tanggal: '2026-03-28',
    nomor: 1,
    kode_video: 'EDU-001',
    views_tiktok: 75,
    views_instagram: 0,
    views_youtube: 5,
    link_tiktok: '',
    link_instagram: '',
    link_youtube: '',
  },
]

describe('analytics helpers', () => {
  it('computes total views and platform totals', () => {
    expect(getPostTotalViews(posts[0])).toBe(150)
    expect(buildPlatformTotals(posts)).toEqual({
      tiktok: 475,
      instagram: 70,
      youtube: 15,
    })
  })

  it('creates trend series grouped by date', () => {
    expect(buildTrendSeries(posts)).toEqual([
      { date: '2026-03-28', tiktok: 75, instagram: 0, youtube: 5 },
      { date: '2026-03-29', tiktok: 400, instagram: 70, youtube: 10 },
    ])
  })

  it('builds ranked top videos and breakdown items', () => {
    expect(buildTopVideos(posts, 2)).toEqual([
      { code: 'PROMO-002', total: 330 },
      { code: 'PROMO-001', total: 150 },
    ])

    expect(buildBreakdownItems(posts, 2)).toEqual([
      { code: 'PROMO-002', tiktok: 300, instagram: 20, youtube: 10 },
      { code: 'PROMO-001', tiktok: 100, instagram: 50, youtube: 0 },
    ])
  })

  it('marks incomplete posts and returns operational status summary', () => {
    expect(isPostIncomplete(posts[0])).toBe(true)
    expect(getStatusHints(posts[0])).toContain('Link YT')
    expect(getStatusHints(posts[2])).toContain('Views IG')
    expect(getOperationalSummary(posts, '2026-03-29')).toEqual({
      totalPosts: 3,
      todaysPosts: 2,
      incompletePosts: 2,
    })
  })
})
