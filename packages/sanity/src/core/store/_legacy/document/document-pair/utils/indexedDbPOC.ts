/* eslint-disable no-console */
import {isSanityDocument, type SanityDocument} from '@sanity/types'

import {type IdPair} from '../../types'

const DB_NAME = 'sanityDocumentsDB'
const DB_VERSION = 1
const STORE_NAME = 'documents'

let idb: IDBDatabase | null = null

function openDatabase() {
  if (idb) {
    return Promise.resolve(idb)
  }
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, {keyPath: '_id'})
      }
    }

    request.onsuccess = () => {
      idb = request.result
      resolve(request.result)
    }

    request.onerror = () => {
      reject(request.error)
    }
  })
}

async function getDocumentFromIndexedDB(id: string): Promise<SanityDocument | null> {
  try {
    const db = await openDatabase()
    return new Promise<SanityDocument | null>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get(id)

      request.onsuccess = () => {
        const result = request.result
        resolve(isSanityDocument(result) ? result : null)
      }

      transaction.onerror = () => {
        console.error(`Error retrieving document with ID ${id} from IndexedDB:`, request.error)
        reject(transaction.error)
      }
    })
  } catch (error) {
    console.error(`Error opening IndexedDB:`, error)
    return null
  }
}

async function saveDocumentToIndexedDB(document: SanityDocument): Promise<void> {
  const db = await openDatabase()
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.put(document)

    request.onsuccess = () => {
      resolve()
    }

    transaction.onerror = () => {
      console.error(`Error saving document with ID ${document._id} to IndexedDB:`, request.error)
      reject(transaction.error)
    }
  })
}

interface DocumentPair {
  draft: SanityDocument | null
  published: SanityDocument | null
}

/**
 * returns the pair in one transaction
 */
async function getDocumentPairIndexedDB(idPair: IdPair): Promise<DocumentPair | null> {
  try {
    const db = await openDatabase()

    const transaction = db.transaction(STORE_NAME, 'readonly')
    const store = transaction.objectStore(STORE_NAME)

    const getDocument = async (id: string): Promise<SanityDocument | null> => {
      try {
        const result = await new Promise<SanityDocument | null>((resolve, reject) => {
          const request = store.get(id)
          request.onsuccess = () => resolve(request.result)
          request.onerror = () => reject(request.error)
        })
        return isSanityDocument(result) ? result : null
      } catch (error) {
        console.error(`Error retrieving document with ID ${id} from IndexedDB:`, error)
        return null
      }
    }

    const [draft, published] = await Promise.all([
      getDocument(idPair.draftId),
      getDocument(idPair.publishedId),
    ])

    return {draft, published}
  } catch (error) {
    console.error(`Error opening IndexedDB:`, error)
    return null
  }
}

async function saveDocumentPairIndexedDB(documentPair: DocumentPair): Promise<void> {
  try {
    const db = await openDatabase()
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)

    const saveDocument = async (doc: SanityDocument | null) => {
      if (!doc) Promise.resolve()
      await new Promise<void>((resolve, reject) => {
        const request = store.put(doc)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    }
    await Promise.all([saveDocument(documentPair.draft), saveDocument(documentPair.published)])
  } catch (error) {
    console.error(`Error opening IndexedDB:`, error)
    throw error
  }
}

export const supportsIndexedDB = (() => {
  try {
    return 'indexedDB' in window && window.indexedDB !== null
  } catch (e) {
    return false
  }
})()

export async function getPairFromIndexedDB(idPair: IdPair): Promise<DocumentPair> {
  console.log('Getting idbPair', idPair)
  if (!supportsIndexedDB) {
    console.info("IndexedDB isn't supported, returning null")
    return {
      draft: null,
      published: null,
    }
  }
  console.time('getPairFromIndexedDB')
  const pair = await getDocumentPairIndexedDB(idPair)
  console.timeEnd('getPairFromIndexedDB')
  if (!pair) {
    return {
      draft: null,
      published: null,
    }
  }
  return pair
}

export async function savePairToIndexedDB(documentPair: DocumentPair | null) {
  console.log('Saving pair to indexedDB', documentPair?.published?._id || documentPair?.draft?._id)
  if (!supportsIndexedDB || !documentPair) return
  console.time('savePairToIndexedDB')
  await saveDocumentPairIndexedDB(documentPair)
  console.timeEnd('savePairToIndexedDB')
}
