import type {SanityDocument} from '@sanity/client'
import type {SchemaType} from '@sanity/types'
import {Box, Inline, Label} from '@sanity/ui'
import React, {useMemo} from 'react'
import {useMemoObservable} from 'react-rx'
import styled from 'styled-components'
import {DocumentPreviewPresence} from '../../../../../../presence'
import {DocumentPreviewStore, SanityDefaultPreview} from '../../../../../../preview'
import {DocumentPresence} from '../../../../../../store'
import {getPreviewStateObservable, getValueWithFallback} from './helpers'

interface SearchResultItemPreviewProps {
  documentId: string
  documentPreviewStore: DocumentPreviewStore
  presence?: DocumentPresence[]
  schemaType: SchemaType
}

/**
 * Brute force all nested boxes on iOS to use `background-attachment: scroll`, as
 * `background-attachment: fixed` (what Sanity UI's <Skeleton> components) isn't yet supported on iOS Safari.
 */
const SearchResultItemPreviewBox = styled(Box)`
  @supports (-webkit-overflow-scrolling: touch) {
    * [data-ui='Box'] {
      background-attachment: scroll;
    }
  }
`

const TypeLabel = styled(Label)`
  max-width: 150px;
`

export default function SearchResultItemPreview({
  documentId,
  documentPreviewStore,
  presence,
  schemaType,
}: SearchResultItemPreviewProps) {
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

  const status = useMemo(() => {
    if (isLoading) return null
    return (
      <Inline space={3}>
        {presence && presence.length > 0 && <DocumentPreviewPresence presence={presence} />}
        <TypeLabel size={0} muted textOverflow="ellipsis">
          {schemaType.title}
        </TypeLabel>
      </Inline>
    )
  }, [isLoading, presence, schemaType.title])

  return (
    <SearchResultItemPreviewBox>
      <SanityDefaultPreview
        {...getValueWithFallback({
          draft,
          published,
          value: sanityDocument,
        })}
        isPlaceholder={isLoading ?? true}
        layout="default"
        icon={schemaType.icon}
        status={status}
        value={sanityDocument}
      />
    </SearchResultItemPreviewBox>
  )
}
