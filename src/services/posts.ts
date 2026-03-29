import type { Post } from '@/types/post'

export interface PostNumberRepository {
  getHighestNomorByDate(tanggal: string, excludeId?: string): Promise<number | null>
}

export async function getNextNomor(repository: PostNumberRepository, tanggal: string, excludeId?: string) {
  const currentHighest = await repository.getHighestNomorByDate(tanggal, excludeId)
  return currentHighest === null ? 1 : currentHighest + 1
}

export interface PostsService extends PostNumberRepository {
  list(): Promise<Post[]>
  create(post: Omit<Post, 'id'>): Promise<void>
  update(id: string, post: Omit<Post, 'id'>): Promise<void>
  remove(id: string): Promise<void>
}
