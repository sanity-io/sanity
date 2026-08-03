import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {of} from 'rxjs'
import {map, startWith} from 'rxjs/operators'

import {getPublishedId} from '../../../util/draftUtils'
import {useDocumentStore} from '../../datastores'

/** @internal */
export interface DocumentTypeResolveState {
  isLoaded: boolean
  documentType: string | undefined
}

const LOADING_STATE: DocumentTypeResolveState = {
  isLoaded: false,
  documentType: undefined,
}

/** @internal */
export function useDocumentType(documentId: string, specifiedType = '*'): DocumentTypeResolveState {
  const documentStore = useDocumentStore()
  const publishedId = getPublishedId(documentId)
  const isResolved = Boolean(specifiedType && specifiedType !== '*')

  // Memoize what a synchronously resolved state looks like (eg specified type is present),
  // in order to return the same object each time. Note that this can be "incorrect", but
  // that we won't be returning it in that case, eg: `{documentType: '*', isResolved: true}
  const SYNC_RESOLVED_STATE = useMemo(
    () => ({documentType: specifiedType, isLoaded: true}),
    [specifiedType],
  )

  const resolvedState$ = useMemo(
    () =>
      // Skip the API when the document type is already known synchronously
      isResolved
        ? of(SYNC_RESOLVED_STATE)
        : documentStore.resolveTypeForDocument(publishedId, specifiedType).pipe(
            map((documentType): DocumentTypeResolveState => ({documentType, isLoaded: true})),
            startWith(LOADING_STATE),
          ),
    [documentStore, isResolved, publishedId, specifiedType, SYNC_RESOLVED_STATE],
  )

  const resolvedState = useObservable(
    resolvedState$,
    isResolved ? SYNC_RESOLVED_STATE : LOADING_STATE,
  )

  return isResolved
    ? // `isResolved` is only true when we're _synchronously_ resolved
      SYNC_RESOLVED_STATE
    : // Using the document type resolved from the API
      resolvedState
}
