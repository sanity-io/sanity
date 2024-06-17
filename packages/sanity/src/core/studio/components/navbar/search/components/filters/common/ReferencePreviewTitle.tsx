import {type SanityDocument, type SchemaType} from '@sanity/types'
import {Skeleton} from '@sanity/ui'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'

import {getPreviewStateObservable, getPreviewValueWithFallback} from '../../../../../../../preview'
import {useDocumentPreviewStore} from '../../../../../../../store'

export function ReferencePreviewTitle({
  documentId,
  schemaType,
}: {
  documentId: string
  schemaType: SchemaType
}) {
  const documentPreviewStore = useDocumentPreviewStore()

  const observable = useMemo(
    () => getPreviewStateObservable(documentPreviewStore, schemaType, documentId, ''),
    [documentId, documentPreviewStore, schemaType],
  )
  const {draft, published, isLoading} = useObservable(observable, {
    draft: null,
    isLoading: true,
    published: null,
  })

  const sanityDocument = useMemo(() => {
    return {
      _id: documentId,
      _type: schemaType.name,
    } as SanityDocument
  }, [documentId, schemaType.name])

  const previewValue = getPreviewValueWithFallback({
    draft,
    published,
    value: sanityDocument,
  })

  if (isLoading) {
    return <Skeleton animated marginLeft={1} radius={2} style={{width: '10ch', height: '1em'}} />
  }

  return <>{previewValue.title || documentId.slice(0, 8)}</>
}
