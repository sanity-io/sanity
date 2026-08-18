import {type SchemaType} from '@sanity/types'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {of} from 'rxjs'

import {useDocumentPreviewStore} from '../../store/datastores'
import {getPreviewStateObservable, type PaneItemPreviewState} from '../utils/paneItemHelpers'

const EMPTY_STATE: PaneItemPreviewState = {}

export default function usePreviewState(
  documentId: string,
  schemaType?: SchemaType,
): PaneItemPreviewState {
  const documentPreviewStore = useDocumentPreviewStore()

  const preview$ = useMemo(
    () =>
      schemaType
        ? getPreviewStateObservable(documentPreviewStore, schemaType, documentId, '')
        : of(EMPTY_STATE),
    [documentPreviewStore, schemaType, documentId],
  )

  // Deferred: react-rx v5's deferral is identity-coherent, so on a document
  // id change the live snapshot wins and the previous document's preview
  // never renders under the new id.
  return useObservable(preview$, EMPTY_STATE)
}
