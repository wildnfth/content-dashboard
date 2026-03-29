import { startTransition, useDeferredValue, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Bar, Doughnut, Line } from 'react-chartjs-2'

import '@/lib/chart'
import { buildBreakdownItems, buildPlatformTotals, buildTopVideos, buildTrendSeries } from '@/lib/analytics'
import { formatDateLabel, formatViews } from '@/lib/formatters'
import { filterPostsByPeriod } from '@/lib/filters'
import { getDaysAgoValue, getTodayValue } from '@/lib/time'
import { supabasePostsService } from '@/services/supabase-posts'
import type { PeriodFilter } from '@/types/post'

import styles from './InsightScreen.module.css'

const periodOptions: Array<{ key: PeriodFilter; label: string }> = [
  { key: 'all', label: 'Semua' },
  { key: 'month', label: 'Bulan ini' },
  { key: '7d', label: '7 hari' },
  { key: '30d', label: '30 hari' },
  { key: '1y', label: '1 tahun' },
  { key: 'custom', label: 'Rentang' },
]

const axisColor = '#725767'
const gridColor = 'rgba(139, 90, 111, 0.12)'

export function InsightScreen() {
  const today = getTodayValue()
  const [period, setPeriod] = useState<PeriodFilter>('month')
  const [customFrom, setCustomFrom] = useState(getDaysAgoValue(29))
  const [customTo, setCustomTo] = useState(today)

  const postsQuery = useQuery({
    queryKey: ['posts'],
    queryFn: () => supabasePostsService.list(),
  })

  const posts = useDeferredValue(postsQuery.data ?? [])
  const filteredPosts = filterPostsByPeriod(posts, period, {
    from: customFrom,
    to: customTo,
    now: new Date(`${today}T12:00:00`),
  })
  const totals = buildPlatformTotals(filteredPosts)
  const trendSeries = buildTrendSeries(filteredPosts)
  const topVideos = buildTopVideos(filteredPosts)
  const breakdownItems = buildBreakdownItems(filteredPosts)

  const trendData = {
    labels: trendSeries.map((item) => formatDateLabel(item.date)),
    datasets: [
      {
        label: 'TikTok',
        data: trendSeries.map((item) => item.tiktok),
        borderColor: '#1a1518',
        backgroundColor: 'rgba(26, 21, 24, 0.08)',
        tension: 0.35,
        fill: true,
      },
      {
        label: 'Instagram',
        data: trendSeries.map((item) => item.instagram),
        borderColor: '#d5488b',
        backgroundColor: 'rgba(213, 72, 139, 0.12)',
        tension: 0.35,
        fill: true,
      },
      {
        label: 'YouTube',
        data: trendSeries.map((item) => item.youtube),
        borderColor: '#b63d46',
        backgroundColor: 'rgba(182, 61, 70, 0.1)',
        tension: 0.35,
        fill: true,
      },
    ],
  }

  const donutData = {
    labels: ['TikTok', 'Instagram', 'YouTube'],
    datasets: [
      {
        data: [totals.tiktok, totals.instagram, totals.youtube],
        backgroundColor: ['#151012', '#d5488b', '#b63d46'],
        borderWidth: 0,
      },
    ],
  }

  const topVideoData = {
    labels: topVideos.map((item) => item.code),
    datasets: [
      {
        label: 'Total Views',
        data: topVideos.map((item) => item.total),
        backgroundColor: ['#151012', '#ae3f76', '#d5488b', '#cf7aa0', '#dec0d2'],
        borderRadius: 999,
      },
    ],
  }

  const breakdownData = {
    labels: breakdownItems.map((item) => item.code),
    datasets: [
      { label: 'TikTok', data: breakdownItems.map((item) => item.tiktok), backgroundColor: '#151012', borderRadius: 12 },
      { label: 'Instagram', data: breakdownItems.map((item) => item.instagram), backgroundColor: '#d5488b', borderRadius: 12 },
      { label: 'YouTube', data: breakdownItems.map((item) => item.youtube), backgroundColor: '#b63d46', borderRadius: 12 },
    ],
  }

  return (
    <section className={styles.page}>
      <section className={styles.filters}>
        <div className={styles.pillRow}>
          {periodOptions.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`${styles.pill} ${period === item.key ? styles.pillActive : ''}`}
              onClick={() => startTransition(() => setPeriod(item.key))}
            >
              {item.label}
            </button>
          ))}
        </div>

        {period === 'custom' ? (
          <div className={styles.rangeRow}>
            <input type="date" value={customFrom} onChange={(event) => setCustomFrom(event.target.value)} />
            <input type="date" value={customTo} onChange={(event) => setCustomTo(event.target.value)} />
          </div>
        ) : null}
      </section>

      {postsQuery.isLoading ? <section className={styles.feedback}>Memuat insight...</section> : null}
      {postsQuery.error ? <section className={styles.feedback}>Gagal memuat insight.</section> : null}

      {!postsQuery.isLoading && !postsQuery.error ? (
        <>
          <section className={styles.metrics}>
            <article>
              <span>TikTok</span>
              <strong>{formatViews(totals.tiktok)}</strong>
              <small>total views</small>
            </article>
            <article>
              <span>Instagram</span>
              <strong>{formatViews(totals.instagram)}</strong>
              <small>total views</small>
            </article>
            <article>
              <span>YouTube</span>
              <strong>{formatViews(totals.youtube)}</strong>
              <small>total views</small>
            </article>
          </section>

          <section className={styles.chartGrid}>
            <article className={styles.heroChart}>
              <div className={styles.chartHeader}>
                <div>
                  <p className={styles.eyebrow}>Trend views</p>
                  <h3>Gerak performa per tanggal</h3>
                </div>
                <span>{filteredPosts.length} post</span>
              </div>
              <div className={styles.chartFrame}>
                <Line
                  data={trendData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        labels: {
                          color: axisColor,
                          font: { family: 'Sora, sans-serif', weight: 600 },
                        },
                      },
                    },
                    scales: {
                      x: {
                        grid: { color: gridColor },
                        ticks: { color: axisColor },
                      },
                      y: {
                        grid: { color: gridColor },
                        ticks: {
                          color: axisColor,
                          callback: (value) => formatViews(Number(value)),
                        },
                      },
                    },
                  }}
                />
              </div>
            </article>

            <article className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <div>
                  <p className={styles.eyebrow}>Distribusi</p>
                  <h3>Perbandingan platform</h3>
                </div>
              </div>
              <div className={styles.chartFrame}>
                <Doughnut
                  data={donutData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '68%',
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: {
                          color: axisColor,
                          font: { family: 'Sora, sans-serif', weight: 600 },
                        },
                      },
                    },
                  }}
                />
              </div>
            </article>

            <article className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <div>
                  <p className={styles.eyebrow}>Peringkat</p>
                  <h3>Top 5 video</h3>
                </div>
              </div>
              <div className={styles.chartFrame}>
                <Bar
                  data={topVideoData}
                  options={{
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                    },
                    scales: {
                      x: {
                        grid: { color: gridColor },
                        ticks: {
                          color: axisColor,
                          callback: (value) => formatViews(Number(value)),
                        },
                      },
                      y: {
                        grid: { display: false },
                        ticks: { color: axisColor },
                      },
                    },
                  }}
                />
              </div>
            </article>

            <article className={`${styles.chartCard} ${styles.fullWidth}`}>
              <div className={styles.chartHeader}>
                <div>
                  <p className={styles.eyebrow}>Breakdown</p>
                  <h3>10 post terakhir lintas platform</h3>
                </div>
              </div>
              <div className={styles.chartFrame}>
                <Bar
                  data={breakdownData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        labels: {
                          color: axisColor,
                          font: { family: 'Sora, sans-serif', weight: 600 },
                        },
                      },
                    },
                    scales: {
                      x: {
                        grid: { display: false },
                        ticks: { color: axisColor },
                      },
                      y: {
                        grid: { color: gridColor },
                        ticks: {
                          color: axisColor,
                          callback: (value) => formatViews(Number(value)),
                        },
                      },
                    },
                  }}
                />
              </div>
            </article>
          </section>
        </>
      ) : null}
    </section>
  )
}
