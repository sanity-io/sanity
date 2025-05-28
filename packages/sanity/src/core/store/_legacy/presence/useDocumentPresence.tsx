import {startTransition, useEffect, useReducer} from 'react'
import {useObservable} from 'react-rx'
import {of} from 'rxjs'

import {usePresenceStore} from '../datastores'
import {type DocumentPresence} from './types'

const initial: DocumentPresence[] = []
const fallback = of(initial)

/** @internal */
export function useDocumentPresence(documentId: string): DocumentPresence[] {
  const [mounted, mount] = useReducer(() => true, false)
  // Using `startTransition` here ensures that rapid re-renders that affect the deps used by `usePresenceStore` delay the transition to `mounted=true`, thus avoiding creating websocket connections that will be closed immediately.
  useEffect(() => startTransition(mount), [])

  const presenceStore = usePresenceStore()
  return useObservable(mounted ? presenceStore.documentPresence(documentId) : fallback, initial)
}
