import type { Post } from '@/types/post'
import { SiInstagram, SiTiktok, SiYoutube } from 'react-icons/si'

import { useBodyScrollLockRef } from '@/hooks/useBodyScrollLock'

import styles from './Sheet.module.css'

interface LinksSheetProps {
  post: Post | null
  onClose: () => void
}

const linkSections = [
  { key: 'link_tiktok', label: 'TikTok', icon: SiTiktok, iconClass: styles.tiktokIcon },
  { key: 'link_instagram', label: 'Instagram', icon: SiInstagram, iconClass: styles.instagramIcon },
  { key: 'link_youtube', label: 'YouTube', icon: SiYoutube, iconClass: styles.youtubeIcon },
] as const

export function LinksSheet({ post, onClose }: LinksSheetProps) {
  if (!post) {
    return null
  }

  return <LinksSheetDialog post={post} onClose={onClose} />
}

interface LinksSheetDialogProps {
  post: Post
  onClose: () => void
}

function LinksSheetDialog({ post, onClose }: LinksSheetDialogProps) {
  const lockBodyScrollRef = useBodyScrollLockRef<HTMLDivElement>()

  return (
    <div ref={lockBodyScrollRef} className={styles.backdrop} onClick={onClose} role="presentation" data-sheet-open="true">
      <section className={styles.sheet} onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Tautan publik</p>
            <h2>{post.kode_video}</h2>
          </div>
          <button type="button" className={styles.iconButton} onClick={onClose} aria-label="Tutup tautan">
            ×
          </button>
        </header>

        <div className={styles.body}>
          <div className={styles.linkList}>
            {linkSections.map((item) => {
              const value = post[item.key]
              const PlatformIcon = item.icon

              if (!value) {
                return (
                  <div key={item.key} className={`${styles.linkCard} ${styles.disabled}`}>
                    <div>
                      <span className={styles.linkTone}>
                        <span className={styles.linkToneRow}>
                          <PlatformIcon className={`${styles.platformIcon} ${item.iconClass}`} aria-hidden="true" />
                          <span>{item.label}</span>
                        </span>
                      </span>
                      <p>Tidak ada link</p>
                    </div>
                    <span>—</span>
                  </div>
                )
              }

              return (
                <a key={item.key} className={styles.linkCard} href={value} target="_blank" rel="noreferrer">
                  <div>
                    <span className={styles.linkTone}>
                      <span className={styles.linkToneRow}>
                        <PlatformIcon className={`${styles.platformIcon} ${item.iconClass}`} aria-hidden="true" />
                        <span>{item.label}</span>
                      </span>
                    </span>
                    <p>{value}</p>
                  </div>
                  <span>↗</span>
                </a>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
