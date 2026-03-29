const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

export function formatViews(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === '' || Number.isNaN(Number(value))) {
    return '—'
  }

  const numericValue = Math.trunc(Number(value))

  if (numericValue >= 1_000_000) {
    return `${(numericValue / 1_000_000).toFixed(1)}M`
  }

  if (numericValue >= 1_000) {
    return `${(numericValue / 1_000).toFixed(1)}K`
  }

  return String(numericValue)
}

export function formatDateLabel(value: string | null | undefined) {
  if (!value) {
    return '—'
  }

  const [year, month, day] = value.split('-').map(Number)

  if (!year || !month || !day) {
    return '—'
  }

  return `${String(day).padStart(2, '0')} ${MONTH_LABELS[month - 1]} ${year}`
}

export function ensureUrl(value: string | null | undefined) {
  if (!value) {
    return null
  }

  if (/^https?:\/\//i.test(value)) {
    return value
  }

  return `https://${value}`
}

export function usernameToEmail(username: string) {
  return `${username.toLowerCase().replace(/[^a-z0-9]/g, '_')}@proton.me`
}
