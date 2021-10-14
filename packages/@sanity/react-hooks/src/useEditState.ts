// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import type {EditStateFor} from '@sanity/base/_internal'
import documentStore from 'part:@sanity/base/datastore/document'
import {useMemoObservable} from 'react-rx'
import {startWith} from 'rxjs/operators'

export function useEditState(publishedDocId: string, docTypeName: string): EditStateFor {
  return useMemoObservable(
    () =>
      documentStore.pair.editState(publishedDocId, docTypeName).pipe(
        startWith({
          id: publishedDocId,
          type: docTypeName,
          draft: null,
          published: null,
          liveEdit: false,
        })
      ),
    [publishedDocId, docTypeName]
  ) as EditStateFor
}
