import {type SanityDocument} from '@sanity/types'
import QuickLRU from 'quick-lru'

export interface DocumentsStorage {
  save: (id: string, doc: SanityDocument) => void
  get: (id: string) => SanityDocument | null
}

export function createDocumentsStorage(): DocumentsStorage {
  const documentsCache = new QuickLRU<string, SanityDocument | null>({
    maxSize: 50,
  })
  return {
    save(id, doc) {
      documentsCache.set(id, doc)
    },
    get(id) {
      return documentsCache.get(id) || null
    },
  }
}
