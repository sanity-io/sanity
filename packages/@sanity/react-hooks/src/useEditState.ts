// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import type {EditStateFor} from '@sanity/base/_internal'
import documentStore from 'part:@sanity/base/datastore/document'
import {useMemoObservable} from 'react-rx'
import {timer, of} from 'rxjs'
import {map, share, switchMap} from 'rxjs/operators'

export function useEditState(
  publishedDocId: string,
  docTypeName: string,
  priority: 'default' | 'low' = 'default'
): EditStateFor {
  return useMemoObservable(() => {
    const base = documentStore.pair.editState(publishedDocId, docTypeName).pipe(share())

    if (priority === 'low') {
      return base.pipe(
        switchMap((editState, index) => {
          if (index === 0) return of(editState)

          return timer(1000).pipe(map(() => editState))
        })
      )
    }

    return base
  }, [publishedDocId, docTypeName, priority]) as EditStateFor
}
