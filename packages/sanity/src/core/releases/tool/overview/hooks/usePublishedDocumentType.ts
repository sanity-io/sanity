import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {map} from 'rxjs'

import {useDocumentPreviewStore} from '../../../../store/datastores'

/**
 * @internal
 */
export interface PublishedDocumentTypeState {
  loading: boolean
  /** `undefined` once loaded means there is no published document */
  documentType: string | undefined
}

const LOADING_DOCUMENT_TYPE: PublishedDocumentTypeState = {loading: true, documentType: undefined}

/**
 * The type of a published document, read through the preview store, which also tells whether the
 * published document exists.
 *
 * @internal
 */
export function usePublishedDocumentType(publishedId: string): PublishedDocumentTypeState {
  const documentPreviewStore = useDocumentPreviewStore()
  const documentType$ = useMemo(
    () =>
      documentPreviewStore
        .observeDocumentTypeFromId(publishedId)
        .pipe(map((documentType): PublishedDocumentTypeState => ({loading: false, documentType}))),
    [documentPreviewStore, publishedId],
  )
  return useObservable(documentType$, LOADING_DOCUMENT_TYPE)
}
