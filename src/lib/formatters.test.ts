import { describe, expect, it } from 'vitest'

import { ensureUrl, formatDateLabel, formatViews, usernameToEmail } from './formatters'

describe('formatters', () => {
  it('formats missing values as an em dash', () => {
    expect(formatViews(null)).toBe('—')
    expect(formatViews('')).toBe('—')
    expect(formatViews(Number.NaN)).toBe('—')
  })

  it('formats large numbers into compact view labels', () => {
    expect(formatViews(999)).toBe('999')
    expect(formatViews(1_520)).toBe('1.5K')
    expect(formatViews(2_100_000)).toBe('2.1M')
  })

  it('formats date labels in the dashboard style', () => {
    expect(formatDateLabel('2026-03-29')).toBe('29 Mar 2026')
    expect(formatDateLabel('')).toBe('—')
  })

  it('normalizes public URLs and usernames', () => {
    expect(ensureUrl('instagram.com/p/abc')).toBe('https://instagram.com/p/abc')
    expect(ensureUrl('https://youtube.com/watch?v=123')).toBe('https://youtube.com/watch?v=123')
    expect(ensureUrl('')).toBeNull()
    expect(usernameToEmail('Lia Gold')).toBe('lia_gold@proton.me')
  })
})
