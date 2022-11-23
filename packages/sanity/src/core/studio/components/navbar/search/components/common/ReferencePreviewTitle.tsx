import type {SanityDocument, SchemaType} from '@sanity/types'
import React, {useMemo} from 'react'
import {useMemoObservable} from 'react-rx'
import {getPreviewStateObservable, getPreviewValueWithFallback} from '../../../../../../preview'
import {useDocumentPreviewStore} from '../../../../../../store'

export function ReferencePreviewTitle({
  documentId,
  schemaType,
}: {
  documentId: string
  schemaType: SchemaType
}) {
  const documentPreviewStore = useDocumentPreviewStore()

  // NOTE: this emits sync so can never be null
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const {draft, published, isLoading} = useMemoObservable(
    () => getPreviewStateObservable(documentPreviewStore, schemaType, documentId, ''),
    [documentId, documentPreviewStore, schemaType]
  )!

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
    return <em>loading...</em>
  }

  return <>{previewValue.title || documentId.slice(0, 8)}</>
}
