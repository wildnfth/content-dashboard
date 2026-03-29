import { startTransition, useDeferredValue, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PlusIcon } from '@heroicons/react/24/outline'
import { SiInstagram, SiTiktok, SiYoutube } from 'react-icons/si'

import { LinksSheet } from '@/components/LinksSheet'
import { PostFormSheet } from '@/components/PostFormSheet'
import { getOperationalSummary, getPostTotalViews, getStatusHints, isPostIncomplete } from '@/lib/analytics'
import { formatDateLabel, formatViews } from '@/lib/formatters'
import { extractPrefix, filterTablePosts, getTableTotalPages, paginatePosts } from '@/lib/filters'
import { getTodayValue } from '@/lib/time'
import { supabasePostsService } from '@/services/supabase-posts'
import { pushToast } from '@/services/toast-store'
import type { Post, TableFilter } from '@/types/post'

import styles from './OperasionalScreen.module.css'

const PAGE_SIZE = 8

export function OperasionalScreen() {
  const queryClient = useQueryClient()
  const today = getTodayValue()
  const [tableFilter, setTableFilter] = useState<TableFilter>('all')
  const [rangeFrom, setRangeFrom] = useState(today)
  const [rangeTo, setRangeTo] = useState(today)
  const [activePrefix, setActivePrefix] = useState('all')
  const [page, setPage] = useState(0)
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [linksPost, setLinksPost] = useState<Post | null>(null)

  const postsQuery = useQuery({
    queryKey: ['posts'],
    queryFn: () => supabasePostsService.list(),
  })

  const deleteMutation = useMutation({
    mutationFn: async (postId: string) => {
      await supabasePostsService.remove(postId)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['posts'] })
      pushToast('Post dihapus.')
    },
    onError: (error) => {
      pushToast(error instanceof Error ? error.message : 'Gagal menghapus post.', 'err')
    },
  })

  const posts = useDeferredValue(postsQuery.data ?? [])
  const prefixes = [...new Set(posts.map((post) => extractPrefix(post.kode_video)).filter(Boolean))] as string[]
  const resolvedPrefix = activePrefix === 'all' || prefixes.includes(activePrefix) ? activePrefix : 'all'
  const prefixFilteredPosts = resolvedPrefix === 'all'
    ? posts
    : posts.filter((post) => extractPrefix(post.kode_video) === resolvedPrefix)

  const tablePosts = filterTablePosts(prefixFilteredPosts, {
    mode: tableFilter,
    today,
    from: rangeFrom,
    to: rangeTo,
  })
  const totalPages = getTableTotalPages(tablePosts, PAGE_SIZE)
  const currentPage = Math.min(page, totalPages - 1)
  const pagePosts = paginatePosts(tablePosts, currentPage, PAGE_SIZE)
  const operationalSummary = getOperationalSummary(posts, today)

  function openCreateSheet() {
    setEditingPost(null)
    setIsFormOpen(true)
  }

  function openEditSheet(post: Post) {
    setEditingPost(post)
    setIsFormOpen(true)
  }

  function closeFormSheet() {
    setEditingPost(null)
    setIsFormOpen(false)
  }

  function handleRangeApply() {
    if (!rangeFrom || !rangeTo) {
      pushToast('Isi rentang tanggal dulu.', 'err')
      return
    }

    if (rangeFrom > rangeTo) {
      pushToast('Tanggal awal harus sebelum tanggal akhir.', 'err')
      return
    }

    startTransition(() => {
      setTableFilter('range')
      setPage(0)
    })
  }

  async function handleDelete(postId: string) {
    if (!window.confirm('Yakin hapus post ini?')) {
      return
    }

    await deleteMutation.mutateAsync(postId)
  }

  return (
    <section className={styles.page}>
      <section className={styles.summaryStrip}>
        <article className={styles.summaryCard}>
          <div className={styles.summaryTopRow}>
            <div className={styles.summaryMetricLine}>
              <span>Post hari ini</span>
              <strong>{operationalSummary.todaysPosts}</strong>
            </div>
            <div className={styles.summaryMetricLine}>
              <span>Belum lengkap</span>
              <strong>{operationalSummary.incompletePosts}</strong>
            </div>
          </div>
          <div className={styles.summaryBottomRow}>
            <span>Total post</span>
            <strong>{operationalSummary.totalPosts}</strong>
          </div>
        </article>
      </section>

      <section className={styles.toolbar}>
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Tanggal</span>
          <div className={styles.pillRow}>
            {[
              { key: 'all', label: 'Semua' },
              { key: 'today', label: 'Hari ini' },
              { key: 'range', label: 'Pilih tanggal' },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                className={`${styles.pill} ${tableFilter === item.key ? styles.pillActive : ''}`}
                onClick={() => {
                  startTransition(() => {
                    setTableFilter(item.key as TableFilter)
                    setPage(0)
                  })
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className={styles.rangeRow}>
            <input type="date" value={rangeFrom} onChange={(event) => setRangeFrom(event.target.value)} />
            <input type="date" value={rangeTo} onChange={(event) => setRangeTo(event.target.value)} />
            <button type="button" className={styles.secondaryAction} onClick={handleRangeApply}>
              Terapkan
            </button>
          </div>
        </div>
      </section>

      {postsQuery.isLoading ? <section className={styles.feedback}>Memuat post...</section> : null}
      {postsQuery.error ? <section className={styles.feedback}>Gagal memuat data post.</section> : null}

      {!postsQuery.isLoading && !postsQuery.error ? (
        <section className={styles.board}>
          <div className={styles.boardHeader}>
            <div>
              <p className={styles.eyebrow}>Daftar post</p>
              <h3>{tablePosts.length} item siap dibuka</h3>
            </div>
          </div>

          <div className={styles.boardSeriesFilter}>
            <span className={styles.filterLabel}>Seri</span>
            <div className={`${styles.pillRow} ${styles.seriesPillRow}`}>
              <button
                type="button"
                className={`${styles.pill} ${styles.seriesPill} ${resolvedPrefix === 'all' ? styles.pillActive : ''}`}
                onClick={() => {
                  setActivePrefix('all')
                  setPage(0)
                }}
              >
                Semua
              </button>
              {prefixes.map((prefix) => (
                <button
                  key={prefix}
                  type="button"
                  className={`${styles.pill} ${styles.seriesPill} ${resolvedPrefix === prefix ? styles.pillActive : ''}`}
                  onClick={() => {
                    setActivePrefix(prefix)
                    setPage(0)
                  }}
                >
                  {prefix}
                </button>
              ))}
            </div>
          </div>

          {!pagePosts.length ? (
            <div className={styles.emptyState}>
              <strong>Belum ada post di filter ini.</strong>
              <p>Ubah tanggal atau tambahkan post baru untuk mulai bekerja dari sini.</p>
            </div>
          ) : (
            <>
              <div className={styles.mobileList}>
                {pagePosts.map((post) => {
                  const incomplete = isPostIncomplete(post)
                  const hints = getStatusHints(post)

                  return (
                    <article
                      key={post.id}
                      className={`${styles.postCard} ${incomplete ? styles.postCardWarn : ''}`}
                      role="button"
                      tabIndex={0}
                      aria-label={`Buka tautan publik ${post.kode_video}`}
                      onClick={() => setLinksPost(post)}
                      onKeyDown={(event) => {
                        if (event.target !== event.currentTarget) {
                          return
                        }

                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          setLinksPost(post)
                        }
                      }}
                    >
                      <div className={styles.cardHeader}>
                        <div>
                          <div className={styles.codeMetaRow}>
                            <button
                              type="button"
                              className={styles.codeButton}
                              onClick={(event) => {
                                event.stopPropagation()
                                setLinksPost(post)
                              }}
                            >
                              {post.kode_video}
                            </button>
                            <p className={styles.postMeta}>
                              {formatDateLabel(post.tanggal)} · {post.jam_upload || '—'}
                            </p>
                          </div>
                        </div>
                        <span className={styles.badgeNo}>#{post.nomor}</span>
                      </div>

                      <div className={styles.viewsStack}>
                        <span className={styles.viewsItem} title="Views TikTok">
                          <SiTiktok className={`${styles.viewsIcon} ${styles.tiktokIcon}`} aria-hidden="true" />
                          {formatViews(post.views_tiktok)}
                        </span>
                        <span className={styles.viewsItem} title="Views Instagram">
                          <SiInstagram className={`${styles.viewsIcon} ${styles.instagramIcon}`} aria-hidden="true" />
                          {formatViews(post.views_instagram)}
                        </span>
                        <span className={styles.viewsItem} title="Views YouTube">
                          <SiYoutube className={`${styles.viewsIcon} ${styles.youtubeIcon}`} aria-hidden="true" />
                          {formatViews(post.views_youtube)}
                        </span>
                        <strong>{formatViews(getPostTotalViews(post))}</strong>
                      </div>

                      {incomplete ? <p className={styles.warnNote}>Belum lengkap: {hints.join(', ')}</p> : null}

                      <div className={styles.cardActions}>
                        <button
                          type="button"
                          className={styles.secondaryAction}
                          onClick={(event) => {
                            event.stopPropagation()
                            openEditSheet(post)
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className={styles.ghostAction}
                          onClick={(event) => {
                            event.stopPropagation()
                            void handleDelete(post.id)
                          }}
                        >
                          Hapus
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>

              <div className={styles.desktopTableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>No.</th>
                      <th>Tanggal</th>
                      <th>Jam</th>
                      <th>Kode video</th>
                      <th>Views</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagePosts.map((post) => {
                      const incomplete = isPostIncomplete(post)
                      const hints = getStatusHints(post)

                      return (
                        <tr key={post.id} className={incomplete ? styles.tableWarn : ''}>
                          <td>
                            <span className={styles.badgeNo}>#{post.nomor}</span>
                          </td>
                          <td>{formatDateLabel(post.tanggal)}</td>
                          <td>{post.jam_upload || '—'}</td>
                          <td>
                            <button type="button" className={styles.codeButton} onClick={() => setLinksPost(post)}>
                              {post.kode_video}
                            </button>
                            {incomplete ? <p className={styles.inlineWarn}>Belum lengkap: {hints.join(', ')}</p> : null}
                          </td>
                          <td>
                            <div className={styles.tableViews}>
                              <span>TT {formatViews(post.views_tiktok)}</span>
                              <span>IG {formatViews(post.views_instagram)}</span>
                              <span>YT {formatViews(post.views_youtube)}</span>
                              <strong>{formatViews(getPostTotalViews(post))}</strong>
                            </div>
                          </td>
                          <td>
                            <div className={styles.tableActions}>
                              <button type="button" className={styles.secondaryAction} onClick={() => openEditSheet(post)}>
                                Edit
                              </button>
                              <button type="button" className={styles.ghostAction} onClick={() => handleDelete(post.id)}>
                                Hapus
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className={styles.pagination}>
                <button type="button" className={styles.pageButton} onClick={() => setPage(Math.max(0, currentPage - 1))} disabled={currentPage === 0}>
                  ‹
                </button>
                <span>
                  Halaman {currentPage + 1} dari {totalPages}
                </span>
                <button
                  type="button"
                  className={styles.pageButton}
                  onClick={() => setPage(Math.min(totalPages - 1, currentPage + 1))}
                  disabled={currentPage >= totalPages - 1}
                >
                  ›
                </button>
              </div>
            </>
          )}
        </section>
      ) : null}

      <div className={styles.floatingCreateWrap}>
        <button
          type="button"
          className={`${styles.primaryAction} ${styles.floatingCreateButton}`}
          onClick={openCreateSheet}
          aria-label="Tambah post"
          title="Tambah post"
        >
          <PlusIcon className={styles.floatingCreateIcon} aria-hidden="true" />
        </button>
      </div>

      <PostFormSheet
        key={`${editingPost?.id ?? 'new'}-${isFormOpen ? 'open' : 'closed'}`}
        open={isFormOpen}
        editingPost={editingPost}
        existingPosts={posts}
        onClose={closeFormSheet}
      />
      <LinksSheet post={linksPost} onClose={() => setLinksPost(null)} />
    </section>
  )
}
