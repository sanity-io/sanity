import {isSanityDocument, type SanityDocument} from '@sanity/types'

import {supportsLocalStorage} from '../../../../../util/supportsLocalStorage'
import {type IdPair} from '../../types'

const createDocumentLocalStorageKey = (documentId: string) => `sanity:editState:${documentId}`

const getDocumentFromLocalStorage = (id: string): SanityDocument | null => {
  if (!supportsLocalStorage) return null

  const key = createDocumentLocalStorageKey(id)

  try {
    const document = localStorage.getItem(key)

    if (!document) return null
    const parsed = JSON.parse(document)
    return isSanityDocument(parsed) ? parsed : null
  } catch (error) {
    console.error(`Error parsing document with ID ${id} from localStorage:`, error)
    return null
  }
}

const saveDocumentToLocalStorage = (document: SanityDocument) => {
  if (!supportsLocalStorage) return

  const key = createDocumentLocalStorageKey(document._id)

  try {
    localStorage.setItem(key, JSON.stringify(document))
  } catch (error) {
    console.error(`Error saving document with ID ${document._id} to localStorage:`, error)
  }
}

/**
 * Function to get the draft and published document from local storage
 * it's not production ready, it's POC only, local storage supports up to 5mb of data which won't be enough for the datasets.
 * @internal
 * @hidden
 */
export const getPairFromLocalStorage = (idPair: IdPair) => {
  if (!supportsLocalStorage) {
    return {
      draft: null,
      published: null,
    }
  }

  return {
    draft: getDocumentFromLocalStorage(idPair.draftId),
    published: getDocumentFromLocalStorage(idPair.publishedId),
  }
}

/**
 * Function to save the draft and published documents to local storage.
 * Note: This is a proof of concept and not production-ready.
 * Local storage supports up to 5MB of data, which will not be sufficient for large datasets.
 * @internal
 * @hidden
 */
export const savePairToLocalStorage = (
  documentPair: {
    draft: SanityDocument | null
    published: SanityDocument | null
  } | null,
) => {
  if (documentPair?.draft) {
    saveDocumentToLocalStorage(documentPair.draft)
  }
  if (documentPair?.published) {
    saveDocumentToLocalStorage(documentPair.published)
  }
}
