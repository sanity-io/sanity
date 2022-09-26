// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import type {EditStateFor} from '@sanity/base/_internal'
import documentStore from 'part:@sanity/base/datastore/document'
import {useMemoObservable} from 'react-rx'
import {merge, timer} from 'rxjs'
import {debounce, share, skip, take} from 'rxjs/operators'

export function useEditState(
  publishedDocId: string,
  docTypeName: string,
  priority: 'default' | 'low' = 'default'
): EditStateFor {
  return useMemoObservable(() => {
    const base = documentStore.pair.editState(publishedDocId, docTypeName).pipe(share())
    if (priority === 'low') {
      return merge(
        base.pipe(take(1)),
        base.pipe(
          skip(1),
          debounce(() => timer(1000))
        )
      )
    }
    return base
  }, [publishedDocId, docTypeName, priority]) as EditStateFor
}
