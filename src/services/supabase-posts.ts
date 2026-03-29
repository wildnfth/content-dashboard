import type { Post, PostInput } from '@/types/post'
import type { PostsService } from '@/services/posts'

import { supabaseClient } from './supabase'

function normalizePost(row: Record<string, unknown>): Post {
  return {
    id: String(row.id),
    tanggal: String(row.tanggal),
    nomor: Number(row.nomor ?? 0),
    jam_upload: row.jam_upload ? String(row.jam_upload) : null,
    kode_video: String(row.kode_video ?? ''),
    link_tiktok: row.link_tiktok ? String(row.link_tiktok) : null,
    link_instagram: row.link_instagram ? String(row.link_instagram) : null,
    link_youtube: row.link_youtube ? String(row.link_youtube) : null,
    views_tiktok: Number(row.views_tiktok ?? 0),
    views_instagram: Number(row.views_instagram ?? 0),
    views_youtube: Number(row.views_youtube ?? 0),
  }
}

async function list() {
  const { data, error } = await supabaseClient
    .from('posts')
    .select('*')
    .order('tanggal', { ascending: true })
    .order('nomor', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map((row) => normalizePost(row))
}

async function create(post: PostInput) {
  const { error } = await supabaseClient.from('posts').insert(post)

  if (error) {
    throw new Error(error.message)
  }
}

async function update(id: string, post: PostInput) {
  const { error } = await supabaseClient.from('posts').update(post).eq('id', id)

  if (error) {
    throw new Error(error.message)
  }
}

async function remove(id: string) {
  const { error } = await supabaseClient.from('posts').delete().eq('id', id)

  if (error) {
    throw new Error(error.message)
  }
}

async function getHighestNomorByDate(tanggal: string, excludeId?: string) {
  let query = supabaseClient
    .from('posts')
    .select('nomor')
    .eq('tanggal', tanggal)
    .order('nomor', { ascending: false })
    .limit(1)

  if (excludeId) {
    query = query.neq('id', excludeId)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(error.message)
  }

  if (!data || data.length === 0) {
    return null
  }

  return Number(data[0].nomor ?? 0)
}

export const supabasePostsService: PostsService = {
  list,
  create,
  update,
  remove,
  getHighestNomorByDate,
}
