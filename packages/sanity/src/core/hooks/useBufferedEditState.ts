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
    readyState: 'loading',
    id: publishedDocId,
    type: docTypeName,
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
          readyState: 'synced',
          published,
          draft,
        })),
      ),
    )
    const sub = published$.subscribe()
    return () => sub.unsubscribe()
  }, [bufferedDataset, publishedDocId])

  return state
}
