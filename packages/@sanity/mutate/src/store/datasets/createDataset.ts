import {type SanityDocumentBase} from '../../mutations/types'

/**
 * Minimalistic dataset implementation that only supports what's strictly necessary
 */
export function createDataset() {
  const documents = new Map<string, SanityDocumentBase | undefined>()
  return {
    set: (id: string, doc: SanityDocumentBase | undefined) =>
      void documents.set(id, doc),
    get: (id: string) => documents.get(id),
    delete: (id: string) => documents.delete(id),
  }
}
