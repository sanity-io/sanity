import {type SchemaType} from '@sanity/types'
import {useMemo} from 'react'
import {of} from 'rxjs'

import {useDocumentPreviewStore} from '../../store/datastores'
import {useDeferredObservableValue} from '../../util/useDeferredObservableValue'
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

  return useDeferredObservableValue(preview$, EMPTY_STATE)
}
