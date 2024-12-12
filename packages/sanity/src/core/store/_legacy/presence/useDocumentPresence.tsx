import {startTransition, useEffect, useState} from 'react'
import {useObservable} from 'react-rx'
import {of} from 'rxjs'

import {usePresenceStore} from '../datastores'
import {type DocumentPresence} from './types'

const initial: DocumentPresence[] = []
const fallback = of(initial)

/** @internal */
export function useDocumentPresence(documentId: string): DocumentPresence[] {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const timeout = setTimeout(() => startTransition(() => setReady(true)))
    return () => clearTimeout(timeout)
  }, [])

  const presenceStore = usePresenceStore()
  return useObservable(ready ? presenceStore.documentPresence(documentId) : fallback, initial)
}
