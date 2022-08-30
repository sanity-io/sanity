import {isEqualWith} from 'lodash'
import {distinctUntilChanged} from 'rxjs/operators'
import type {User} from '@sanity/types'
import {useState, useEffect} from 'react'
import type {DocumentPresence} from './types'
import {documentPresence, documentPresenceUsers} from './presence-store'

export interface UseDocumentPresenceOptions {
  ignoreLastActiveUpdates?: boolean
}

export function useDocumentPresence(
  documentId,
  {ignoreLastActiveUpdates}: UseDocumentPresenceOptions = {}
): DocumentPresence[] {
  const [presence, setPresence] = useState<DocumentPresence[]>([])
  useEffect(() => {
    const presence$ = documentPresence(documentId)
    const mapped$ = ignoreLastActiveUpdates
      ? presence$.pipe(distinctUntilChanged((x, y) => isEqualWith(x, y, trueIfLastActiveAt)))
      : presence$
    const subscription = mapped$.subscribe(setPresence)
    return () => {
      subscription.unsubscribe()
    }
  }, [documentId, ignoreLastActiveUpdates])
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

/**
 * For use with `isEqualWith` - returning `undefined` will use the default
 * `isEqual` algorithm, while returning `true` will treat that path as
 * equal. We do this for the `lastActiveAt` property at any level, in order
 * to disregard the timestamp in equality comparisons, if specified
 */
function trueIfLastActiveAt(
  a: unknown,
  b: unknown,
  key: string | number | symbol
): true | undefined {
  return key === 'lastActiveAt' ? true : undefined
}
