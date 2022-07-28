import {createHookFromObservableFactory, getPublishedId} from '@sanity/base/_internal'
import documentStore from 'part:@sanity/base/datastore/document'
import {Observable} from 'rxjs'

export const useDocumentsIsReferenced = createHookFromObservableFactory((documentId: string) => {
  const totalClause = 'count(*[references($documentId)]) > 0'

  return documentStore.listenQuery(
    totalClause,
    {documentId: getPublishedId(documentId)},
    {tag: 'use-document-is-referenced'}
  ) as Observable<boolean>
})
