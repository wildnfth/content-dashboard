import type { PeriodFilter, Post, TableFilter } from '@/types/post'

interface PeriodOptions {
  now?: Date
  from?: string
  to?: string
}

interface TableOptions {
  mode: TableFilter
  today: string
  from?: string
  to?: string
}

function toStartOfDay(value: string) {
  return new Date(`${value}T00:00:00`)
}

function toEndOfDay(value: string) {
  return new Date(`${value}T23:59:59`)
}

export function extractPrefix(code: string | null | undefined) {
  if (!code) {
    return null
  }

  const match = code.match(/^([A-Z]+)/)
  return match ? match[1] : null
}

export function sortPostsDescending(posts: Post[]) {
  return [...posts].sort((left, right) => {
    if (right.tanggal > left.tanggal) {
      return 1
    }

    if (right.tanggal < left.tanggal) {
      return -1
    }

    return (right.nomor ?? 0) - (left.nomor ?? 0)
  })
}

export function filterPostsByPeriod(posts: Post[], period: PeriodFilter, options: PeriodOptions = {}) {
  if (period === 'all') {
    return posts
  }

  const now = options.now ?? new Date()
  let from: Date | null = null
  let to: Date | null = new Date(now)
  to.setHours(23, 59, 59, 999)

  if (period === 'month') {
    from = new Date(now.getFullYear(), now.getMonth(), 1)
    to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
  } else if (period === '7d') {
    from = new Date(now)
    from.setDate(from.getDate() - 6)
    from.setHours(0, 0, 0, 0)
  } else if (period === '30d') {
    from = new Date(now)
    from.setDate(from.getDate() - 29)
    from.setHours(0, 0, 0, 0)
  } else if (period === '1y') {
    from = new Date(now)
    from.setFullYear(from.getFullYear() - 1)
    from.setHours(0, 0, 0, 0)
  } else if (period === 'custom' && options.from && options.to) {
    from = toStartOfDay(options.from)
    to = toEndOfDay(options.to)
  }

  if (!from) {
    return posts
  }

  return posts.filter((post) => {
    if (!post.tanggal) {
      return false
    }

    const publishedDate = toStartOfDay(post.tanggal)
    return publishedDate >= from && publishedDate <= to
  })
}

export function filterTablePosts(posts: Post[], options: TableOptions) {
  let filtered = posts

  if (options.mode === 'today') {
    filtered = posts.filter((post) => post.tanggal === options.today)
  } else if (options.mode === 'range' && options.from && options.to) {
    filtered = posts.filter((post) => post.tanggal >= options.from! && post.tanggal <= options.to!)
  }

  return sortPostsDescending(filtered)
}

export function getTableTotalPages(posts: Post[], pageSize: number) {
  return Math.max(1, Math.ceil(posts.length / pageSize))
}

export function paginatePosts(posts: Post[], page: number, pageSize: number) {
  const start = page * pageSize
  return posts.slice(start, start + pageSize)
}
