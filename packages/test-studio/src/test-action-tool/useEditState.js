import documentStore from 'part:@sanity/base/datastore/document'

import {useObservable} from '../actions/hooks'
export function useEditState(publishedId, typeName) {
  return useObservable(documentStore.local.editStateOf(publishedId, typeName))
}
