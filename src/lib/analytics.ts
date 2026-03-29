import type { Post } from '@/types/post'

export function getPostTotalViews(post: Post) {
  return (post.views_tiktok ?? 0) + (post.views_instagram ?? 0) + (post.views_youtube ?? 0)
}

export function buildPlatformTotals(posts: Post[]) {
  return posts.reduce(
    (totals, post) => ({
      tiktok: totals.tiktok + (post.views_tiktok ?? 0),
      instagram: totals.instagram + (post.views_instagram ?? 0),
      youtube: totals.youtube + (post.views_youtube ?? 0),
    }),
    {
      tiktok: 0,
      instagram: 0,
      youtube: 0,
    },
  )
}

export function buildTrendSeries(posts: Post[]) {
  const grouped = new Map<string, { date: string; tiktok: number; instagram: number; youtube: number }>()

  posts.forEach((post) => {
    const existing = grouped.get(post.tanggal) ?? {
      date: post.tanggal,
      tiktok: 0,
      instagram: 0,
      youtube: 0,
    }

    existing.tiktok += post.views_tiktok ?? 0
    existing.instagram += post.views_instagram ?? 0
    existing.youtube += post.views_youtube ?? 0

    grouped.set(post.tanggal, existing)
  })

  return [...grouped.values()].sort((left, right) => left.date.localeCompare(right.date))
}

export function buildTopVideos(posts: Post[], limit = 5) {
  return posts
    .map((post) => ({
      code: post.kode_video,
      total: getPostTotalViews(post),
    }))
    .sort((left, right) => right.total - left.total)
    .slice(0, limit)
}

export function buildBreakdownItems(posts: Post[], limit = 10) {
  return [...posts]
    .sort((left, right) => {
      if (right.tanggal > left.tanggal) {
        return 1
      }

      if (right.tanggal < left.tanggal) {
        return -1
      }

      return (right.nomor ?? 0) - (left.nomor ?? 0)
    })
    .slice(0, limit)
    .map((post) => ({
      code: post.kode_video,
      tiktok: post.views_tiktok ?? 0,
      instagram: post.views_instagram ?? 0,
      youtube: post.views_youtube ?? 0,
    }))
}

export function isPostIncomplete(post: Post) {
  const missingLink = !post.link_tiktok || !post.link_instagram || !post.link_youtube
  const missingViews = !(post.views_tiktok && post.views_tiktok > 0)
    || !(post.views_instagram && post.views_instagram > 0)
    || !(post.views_youtube && post.views_youtube > 0)

  return missingLink || missingViews
}

export function getStatusHints(post: Post) {
  const hints: string[] = []

  if (!post.link_tiktok) hints.push('Link TT')
  if (!post.link_instagram) hints.push('Link IG')
  if (!post.link_youtube) hints.push('Link YT')
  if (!(post.views_tiktok && post.views_tiktok > 0)) hints.push('Views TT')
  if (!(post.views_instagram && post.views_instagram > 0)) hints.push('Views IG')
  if (!(post.views_youtube && post.views_youtube > 0)) hints.push('Views YT')

  return hints
}

export function getOperationalSummary(posts: Post[], today: string) {
  return {
    totalPosts: posts.length,
    todaysPosts: posts.filter((post) => post.tanggal === today).length,
    incompletePosts: posts.filter(isPostIncomplete).length,
  }
}
