// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import {DocumentPresence, DocumentPreviewPresence} from '@sanity/base/presence'
import type {SanityDocument} from '@sanity/client'
import type {SchemaType} from '@sanity/types'
import {Inline, Label} from '@sanity/ui'
import {SanityDefaultPreview} from 'part:@sanity/base/preview'
import React, {useEffect, useMemo, useState} from 'react'
import {getPreviewStateObservable, getValueWithFallback} from './helpers'
import type {SearchItemPreviewState} from './types'

interface SearchResultItemPreviewProps {
  documentId: string
  presence?: DocumentPresence[]
  schemaType: SchemaType
}

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
        <Label size={0} muted style={{maxWidth: '150px'}} textOverflow="ellipsis">
          {schemaType.title}
        </Label>
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
    <SanityDefaultPreview
      isPlaceholder={document?.isLoading ?? true}
      layout="default"
      icon={schemaType.icon}
      status={status}
      value={sanityDocument}
    />
  )
}
