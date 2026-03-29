import { describe, expect, it, vi } from 'vitest'

import { getNextNomor } from './posts'

describe('getNextNomor', () => {
  it('starts numbering from one when there are no posts on the selected date', async () => {
    const repository = {
      getHighestNomorByDate: vi.fn().mockResolvedValue(null),
    }

    await expect(getNextNomor(repository, '2026-03-29')).resolves.toBe(1)
    expect(repository.getHighestNomorByDate).toHaveBeenCalledWith('2026-03-29', undefined)
  })

  it('increments the highest number and forwards excludeId', async () => {
    const repository = {
      getHighestNomorByDate: vi.fn().mockResolvedValue(6),
    }

    await expect(getNextNomor(repository, '2026-03-29', 'post-9')).resolves.toBe(7)
    expect(repository.getHighestNomorByDate).toHaveBeenCalledWith('2026-03-29', 'post-9')
  })
})
