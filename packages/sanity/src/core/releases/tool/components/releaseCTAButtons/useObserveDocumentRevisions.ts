import {isSanityDocument, type SanityDocument} from '@sanity/types'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {map} from 'rxjs/operators'

import {getPublishedId} from '../../../../util'
import {useDocumentPreviewStore} from '../../../index'

export const useObserveDocumentRevisions = (documents: SanityDocument[]) => {
  const previewStore = useDocumentPreviewStore()
  const publishedDocumentIds = documents.map(({_id}) => getPublishedId(_id))

  const memoObservable = useMemo(
    () =>
      previewStore.unstable_observeDocuments(publishedDocumentIds).pipe(
        map((publishedDocuments) =>
          publishedDocuments
            .filter(isSanityDocument)
            .reduce<Record<SanityDocument['_id'], SanityDocument['_rev']>>(
              (accPublishedDocs, {_id, _rev}) => ({
                ...accPublishedDocs,
                [_id]: _rev,
              }),
              {},
            ),
        ),
      ),
    [previewStore, publishedDocumentIds],
  )

  return useObservable(memoObservable)
}
