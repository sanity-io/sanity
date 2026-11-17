import {type SchemaType} from '@sanity/types'
import {Skeleton} from '@sanity/ui'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'

import {getPreviewStateObservable} from '../../../../../../../preview/utils/getPreviewStateObservable'
import {useDocumentPreviewStore} from '../../../../../../../store/datastores'

const INITIAL_PREVIEW_STATE = {
  isLoading: true,
  snapshot: null,
  original: null,
}

export function ReferencePreviewTitle({
  documentId,
  schemaType,
}: {
  documentId: string
  schemaType: SchemaType
}) {
  const documentPreviewStore = useDocumentPreviewStore()

  const observable = useMemo(
    () => getPreviewStateObservable(documentPreviewStore, schemaType, documentId),
    [documentId, documentPreviewStore, schemaType],
  )
  const {snapshot, original, isLoading} = useObservable(observable, INITIAL_PREVIEW_STATE)

  if (isLoading) {
    return <Skeleton animated marginLeft={1} radius={2} style={{width: '10ch', height: '1em'}} />
  }

  return <>{snapshot?.title || original?.title || documentId.slice(0, 8)}</>
}
