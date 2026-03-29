export type PeriodFilter = 'all' | 'month' | '7d' | '30d' | '1y' | 'custom'

export type TableFilter = 'all' | 'today' | 'range'

export interface Post {
  id: string
  tanggal: string
  nomor: number
  kode_video: string
  jam_upload?: string | null
  link_tiktok?: string | null
  link_instagram?: string | null
  link_youtube?: string | null
  views_tiktok?: number | null
  views_instagram?: number | null
  views_youtube?: number | null
}

export type PostInput = Omit<Post, 'id'>
