import type {User} from '@sanity/types'
import {useState, useEffect} from 'react'
import type {DocumentPresence} from './types'
import {documentPresence, documentPresenceUsers} from './presence-store'

export function useDocumentPresence(documentId): DocumentPresence[] {
  const [presence, setPresence] = useState<DocumentPresence[]>([])
  useEffect(() => {
    const subscription = documentPresence(documentId).subscribe(setPresence)
    return () => {
      subscription.unsubscribe()
    }
  }, [documentId])
  return presence
}

/**
 * Returns a list of document-level users present in the document, without any additional
 * information on paths or when they were last active etc. This is useful for displaying a
 * list of users without re-rendering on minimal changes.
 *
 * @internal Rework this for v3
 */
export function useDocumentPresenceUsers(documentId): User[] {
  const [presence, setPresence] = useState<User[]>([])
  useEffect(() => {
    const subscription = documentPresenceUsers(documentId).subscribe(setPresence)
    return () => {
      subscription.unsubscribe()
    }
  }, [documentId])
  return presence
}
