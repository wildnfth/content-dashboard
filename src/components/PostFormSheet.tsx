import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useBodyScrollLockRef } from '@/hooks/useBodyScrollLock'
import { focusNextFieldOrSubmit } from '@/lib/focus'
import { ensureUrl } from '@/lib/formatters'
import { getCurrentTimeValue, getTodayValue } from '@/lib/time'
import { getNextNomor } from '@/services/posts'
import { supabasePostsService } from '@/services/supabase-posts'
import { pushToast } from '@/services/toast-store'
import type { Post, PostInput } from '@/types/post'

import styles from './Sheet.module.css'

interface PostFormSheetProps {
  open: boolean
  editingPost: Post | null
  existingPosts: Post[]
  onClose: () => void
}

export function PostFormSheet({ open, editingPost, existingPosts, onClose }: PostFormSheetProps) {
  if (!open) {
    return null
  }

  return (
    <PostFormSheetDialog
      editingPost={editingPost}
      existingPosts={existingPosts}
      onClose={onClose}
    />
  )
}

interface PostFormSheetDialogProps {
  editingPost: Post | null
  existingPosts: Post[]
  onClose: () => void
}

function PostFormSheetDialog({ editingPost, existingPosts, onClose }: PostFormSheetDialogProps) {
  const queryClient = useQueryClient()
  const lockBodyScrollRef = useBodyScrollLockRef<HTMLDivElement>()
  const [initialForm] = useState(() => ({
    tanggal: editingPost?.tanggal ?? getTodayValue(),
    jamUpload: editingPost?.jam_upload ?? getCurrentTimeValue(),
    kodeVideo: editingPost?.kode_video ?? '',
    linkTiktok: editingPost?.link_tiktok ?? '',
    linkInstagram: editingPost?.link_instagram ?? '',
    linkYoutube: editingPost?.link_youtube ?? '',
    viewsTiktok: String(editingPost?.views_tiktok ?? 0),
    viewsInstagram: String(editingPost?.views_instagram ?? 0),
    viewsYoutube: String(editingPost?.views_youtube ?? 0),
  }))
  const [tanggal, setTanggal] = useState(initialForm.tanggal)
  const [jamUpload, setJamUpload] = useState(initialForm.jamUpload)
  const [kodeVideo, setKodeVideo] = useState(initialForm.kodeVideo)
  const [linkTiktok, setLinkTiktok] = useState(initialForm.linkTiktok)
  const [linkInstagram, setLinkInstagram] = useState(initialForm.linkInstagram)
  const [linkYoutube, setLinkYoutube] = useState(initialForm.linkYoutube)
  const [viewsTiktok, setViewsTiktok] = useState(initialForm.viewsTiktok)
  const [viewsInstagram, setViewsInstagram] = useState(initialForm.viewsInstagram)
  const [viewsYoutube, setViewsYoutube] = useState(initialForm.viewsYoutube)
  const [showExitConfirm, setShowExitConfirm] = useState(false)

  const saveMutation = useMutation({
    mutationFn: async () => {
      const normalizedCode = kodeVideo.trim().toUpperCase()

      if (!tanggal) {
        throw new Error('Tanggal wajib diisi.')
      }

      if (!normalizedCode) {
        throw new Error('Kode video wajib diisi.')
      }

      const duplicatePost = existingPosts.find(
        (post) => post.kode_video === normalizedCode && post.id !== editingPost?.id,
      )

      if (duplicatePost) {
        throw new Error(`Kode "${normalizedCode}" sudah dipakai.`)
      }

      const nomor = editingPost && editingPost.tanggal === tanggal
        ? editingPost.nomor
        : await getNextNomor(supabasePostsService, tanggal, editingPost?.id)

      const payload: PostInput = {
        tanggal,
        nomor,
        jam_upload: jamUpload || null,
        kode_video: normalizedCode,
        link_tiktok: ensureUrl(linkTiktok.trim()),
        link_instagram: ensureUrl(linkInstagram.trim()),
        link_youtube: ensureUrl(linkYoutube.trim()),
        views_tiktok: Number(viewsTiktok || 0),
        views_instagram: Number(viewsInstagram || 0),
        views_youtube: Number(viewsYoutube || 0),
      }

      if (editingPost) {
        await supabasePostsService.update(editingPost.id, payload)
        return 'updated'
      }

      await supabasePostsService.create(payload)
      return 'created'
    },
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ['posts'] })
      pushToast(result === 'updated' ? 'Post berhasil diperbarui.' : 'Post berhasil ditambahkan.')
      onClose()
    },
    onError: (error) => {
      pushToast(error instanceof Error ? error.message : 'Gagal menyimpan post.', 'err')
    },
  })

  const hasUnsavedChanges = (
    tanggal !== initialForm.tanggal
    || (jamUpload || '') !== (initialForm.jamUpload || '')
    || kodeVideo.trim().toUpperCase() !== initialForm.kodeVideo.trim().toUpperCase()
    || linkTiktok.trim() !== initialForm.linkTiktok.trim()
    || linkInstagram.trim() !== initialForm.linkInstagram.trim()
    || linkYoutube.trim() !== initialForm.linkYoutube.trim()
    || Number(viewsTiktok || 0) !== Number(initialForm.viewsTiktok || 0)
    || Number(viewsInstagram || 0) !== Number(initialForm.viewsInstagram || 0)
    || Number(viewsYoutube || 0) !== Number(initialForm.viewsYoutube || 0)
  )

  function requestClose() {
    if (saveMutation.isPending) {
      return
    }

    if (hasUnsavedChanges) {
      setShowExitConfirm(true)
      return
    }

    onClose()
  }

  return (
    <div ref={lockBodyScrollRef} className={styles.backdrop} onClick={requestClose} role="presentation" data-sheet-open="true">
      <section
        className={styles.sheet}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) =>
          focusNextFieldOrSubmit(event, () => {
            if (!saveMutation.isPending) {
              saveMutation.mutate()
            }
          })}
        role="dialog"
        aria-modal="true"
      >
        <header className={styles.header}>
          <div>
            <h2>{editingPost ? 'Edit post' : 'Tambah post baru'}</h2>
          </div>
          <button type="button" className={styles.iconButton} onClick={requestClose} aria-label="Tutup form">
            ×
          </button>
        </header>

        <div className={styles.body}>
          <div className={styles.grid}>
            <div className={`${styles.rowTwo} ${styles.full}`}>
              <label className={styles.field}>
                <span>Tanggal</span>
                <input type="date" value={tanggal} onChange={(event) => setTanggal(event.target.value)} />
              </label>

              <label className={styles.field}>
                <span>Jam upload</span>
                <input type="time" value={jamUpload ?? ''} onChange={(event) => setJamUpload(event.target.value)} />
              </label>
            </div>

            <label className={`${styles.field} ${styles.full}`}>
              <span>Kode video</span>
              <input
                type="text"
                value={kodeVideo}
                onChange={(event) => setKodeVideo(event.target.value.toUpperCase())}
                placeholder="PROMO-001"
              />
            </label>

            <label className={`${styles.field} ${styles.full}`}>
              <span>Link TikTok</span>
              <input type="url" value={linkTiktok ?? ''} onChange={(event) => setLinkTiktok(event.target.value)} />
            </label>

            <label className={`${styles.field} ${styles.full}`}>
              <span>Link Instagram</span>
              <input type="url" value={linkInstagram ?? ''} onChange={(event) => setLinkInstagram(event.target.value)} />
            </label>

            <label className={`${styles.field} ${styles.full}`}>
              <span>Link YouTube</span>
              <input type="url" value={linkYoutube ?? ''} onChange={(event) => setLinkYoutube(event.target.value)} />
            </label>

            <div className={`${styles.rowThree} ${styles.full}`}>
              <label className={styles.field}>
                <span>TT</span>
                <input type="number" min="0" value={viewsTiktok} onChange={(event) => setViewsTiktok(event.target.value)} />
              </label>

              <label className={styles.field}>
                <span>IG</span>
                <input
                  type="number"
                  min="0"
                  value={viewsInstagram}
                  onChange={(event) => setViewsInstagram(event.target.value)}
                />
              </label>

              <label className={styles.field}>
                <span>YT</span>
                <input type="number" min="0" value={viewsYoutube} onChange={(event) => setViewsYoutube(event.target.value)} />
              </label>
            </div>
          </div>
        </div>

        <footer className={styles.footer}>
          <button type="button" className={styles.secondaryAction} onClick={requestClose}>
            Batal
          </button>
          <button type="button" className={styles.primaryAction} onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'Menyimpan...' : editingPost ? 'Simpan perubahan' : 'Simpan post'}
          </button>
        </footer>
      </section>

      {showExitConfirm ? (
        <div className={styles.confirmBackdrop} onClick={() => setShowExitConfirm(false)} role="presentation">
          <section className={styles.confirmCard} onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
            <h3>Keluar dari form?</h3>
            <p>Perubahan yang belum disimpan akan hilang.</p>
            <div className={styles.confirmActions}>
              <button type="button" className={styles.secondaryAction} onClick={() => setShowExitConfirm(false)}>
                Lanjut edit
              </button>
              <button type="button" className={styles.dangerAction} onClick={onClose}>
                Keluar form
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  )
}
