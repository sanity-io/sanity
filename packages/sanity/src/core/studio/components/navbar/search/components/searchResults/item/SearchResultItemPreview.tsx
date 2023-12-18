import type {SanityDocument} from '@sanity/client'
import type {SchemaType} from '@sanity/types'
import {Badge, Box, Flex} from '@sanity/ui'
import React, {useMemo} from 'react'
import {useMemoObservable} from 'react-rx'
import styled from 'styled-components'
import {DocumentStatus} from '../../../../../../../components/documentStatus'
import {DocumentStatusIndicator} from '../../../../../../../components/documentStatusIndicator'
import {DocumentPreviewPresence} from '../../../../../../../presence'
import {
  getPreviewStateObservable,
  getPreviewValueWithFallback,
  SanityDefaultPreview,
} from '../../../../../../../preview'
import {DocumentPresence, useDocumentPreviewStore} from '../../../../../../../store'
import {GeneralPreviewLayoutKey} from '../../../../../../../components'

interface SearchResultItemPreviewProps {
  documentId: string
  layout?: GeneralPreviewLayoutKey
  presence?: DocumentPresence[]
  schemaType: SchemaType
}

/**
 * Temporary workaround: force all nested boxes on iOS to use `background-attachment: scroll`
 * to allow <Skeleton> components to render correctly within virtual lists.
 */
const SearchResultItemPreviewBox = styled(Box)`
  @supports (-webkit-overflow-scrolling: touch) {
    * [data-ui='Box'] {
      background-attachment: scroll;
    }
  }
`

export default function SearchResultItemPreview({
  documentId,
  layout,
  presence,
  schemaType,
}: SearchResultItemPreviewProps) {
  const documentPreviewStore = useDocumentPreviewStore()

  // NOTE: this emits sync so can never be null
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const {draft, published, isLoading} = useMemoObservable(
    () => getPreviewStateObservable(documentPreviewStore, schemaType, documentId, ''),
    [documentId, documentPreviewStore, schemaType],
  )!

  const sanityDocument = useMemo(() => {
    return {
      _id: documentId,
      _type: schemaType.name,
    } as SanityDocument
  }, [documentId, schemaType.name])

  const status = useMemo(() => {
    if (isLoading) return null
    return (
      <Flex align="center" gap={3}>
        {presence && presence.length > 0 && <DocumentPreviewPresence presence={presence} />}
        <Badge>{schemaType.title}</Badge>
        <DocumentStatusIndicator draft={draft} hidePublishedStatus published={published} />
      </Flex>
    )
  }, [draft, isLoading, presence, published, schemaType.title])

  const tooltip = <DocumentStatus draft={draft} published={published} />

  return (
    <SearchResultItemPreviewBox>
      <SanityDefaultPreview
        {...getPreviewValueWithFallback({
          draft,
          published,
          value: sanityDocument,
        })}
        isPlaceholder={isLoading ?? true}
        layout={layout || 'default'}
        icon={schemaType.icon}
        status={status}
        tooltip={tooltip}
      />
    </SearchResultItemPreviewBox>
  )
}
