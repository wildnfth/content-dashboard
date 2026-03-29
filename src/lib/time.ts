export function padTime(value: number) {
  return String(value).padStart(2, '0')
}

export function getTodayValue(now = new Date()) {
  return `${now.getFullYear()}-${padTime(now.getMonth() + 1)}-${padTime(now.getDate())}`
}

export function getCurrentTimeValue(now = new Date()) {
  return `${padTime(now.getHours())}:${padTime(now.getMinutes())}`
}

export function getDaysAgoValue(days: number, now = new Date()) {
  const copy = new Date(now)
  copy.setDate(copy.getDate() - days)
  return getTodayValue(copy)
}
