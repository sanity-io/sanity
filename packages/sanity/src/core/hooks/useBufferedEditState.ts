import {useEffect, useState} from 'react'
import {combineLatest} from 'rxjs'
import {tap} from 'rxjs/operators'

import {type EditState} from '../store'
import {getDraftId} from '../util'
import {useBufferedDataset} from './useBufferedDataset'
import {useClient} from './useClient'

/** @internal */
export function useEditState2(publishedDocId: string, docTypeName: string): EditState {
  const client = useClient({apiVersion: 'v2024-03-07'})
  const bufferedDataset = useBufferedDataset(client)
  const [state, setState] = useState<EditState>({
    ready: false,
    id: publishedDocId,
    type: docTypeName,
    transactionSyncLock: null,
    liveEdit: false,
    published: null,
    draft: null,
  })

  // bufferedDataset.mutate()

  useEffect(() => {
    const published$ = combineLatest([
      bufferedDataset.observe(publishedDocId),
      bufferedDataset.observe(getDraftId(publishedDocId)),
    ]).pipe(
      tap(([published, draft]) =>
        setState((current) => ({
          ...current,
          type: docTypeName,
          id: publishedDocId,
          ready: true,
          transactionSyncLock: null,
          liveEdit: false,
          published: published || null,
          draft: draft || null,
        })),
      ),
    )
    const sub = published$.subscribe()
    return () => sub.unsubscribe()
  }, [bufferedDataset, docTypeName, publishedDocId])

  return state
}
