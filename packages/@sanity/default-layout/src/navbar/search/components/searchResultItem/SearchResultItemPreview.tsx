// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import {DocumentPreviewPresence} from '@sanity/base/presence'
import type {SanityDocument} from '@sanity/client'
import type {SchemaType, User} from '@sanity/types'
import {Box, Inline, Label} from '@sanity/ui'
import {SanityDefaultPreview} from 'part:@sanity/base/preview'
import React, {useEffect, useMemo, useState} from 'react'
import styled from 'styled-components'
import {getPreviewStateObservable, getValueWithFallback} from './helpers'
import type {SearchItemPreviewState} from './types'

interface SearchResultItemPreviewProps {
  documentId: string
  presence?: User[]
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
  presence,
  schemaType,
}: SearchResultItemPreviewProps) {
  const [document, setDocument] = useState<SearchItemPreviewState>()

  useEffect(() => {
    const subscription = getPreviewStateObservable(schemaType, documentId, '').subscribe((state) =>
      setDocument(state)
    )
    return () => subscription?.unsubscribe()
  }, [schemaType, documentId])

  const status = useMemo(() => {
    return (
      <Inline space={3}>
        {presence && presence.length > 0 && <DocumentPreviewPresence presence={presence} />}
        <TypeLabel size={0} muted textOverflow="ellipsis">
          {schemaType.title}
        </TypeLabel>
      </Inline>
    )
  }, [presence, schemaType.title])

  const sanityDocument = useMemo(() => {
    if (document) {
      return getValueWithFallback({
        draft: document.draft,
        published: document.published,
        value: {
          _id: documentId,
          _type: schemaType.name,
        } as SanityDocument,
      })
    }
    return null
  }, [document, documentId, schemaType.name])

  return (
    <SearchResultItemPreviewBox>
      <SanityDefaultPreview
        isPlaceholder={document?.isLoading ?? true}
        layout="default"
        icon={schemaType.icon}
        status={status}
        value={sanityDocument}
      />
    </SearchResultItemPreviewBox>
  )
}
