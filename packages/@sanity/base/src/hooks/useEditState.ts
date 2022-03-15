// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import type {EditStateFor} from '@sanity/base/_internal'
import documentStore from 'part:@sanity/base/datastore/document'
import {useMemoObservable} from 'react-rx'

export function useEditState(publishedDocId: string, docTypeName: string): EditStateFor {
  return useMemoObservable(() => documentStore.pair.editState(publishedDocId, docTypeName), [
    publishedDocId,
    docTypeName,
  ]) as EditStateFor
}
