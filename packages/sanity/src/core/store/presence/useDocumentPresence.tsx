import {useMemo} from 'react'
import {useSyncObservable} from 'react-rx'

import {usePresenceStore} from '../datastores'
import {type DocumentPresence} from './types'

const initial: DocumentPresence[] = []

/** @internal */
export function useDocumentPresence(documentId: string): DocumentPresence[] {
  const presenceStore = usePresenceStore()
  const presence$ = useMemo(
    () => presenceStore.documentPresence(documentId),
    [presenceStore, documentId],
  )
  // Kept synchronous: presence emits per collaborator report with no incoming
  // rate limit, and deferred delivery lets a sustained burst restart the
  // in-flight render pass indefinitely — the pane never settles while the
  // burst lasts. Synchronous delivery commits every update, so rendering
  // always makes progress.
  return useSyncObservable(presence$, initial)
}
