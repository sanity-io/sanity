import React, {useCallback} from 'react'
import type {SanityDocument, SchemaType} from '@sanity/types'
import {getPublishedId} from '../../../core/util'
import {PreviewCard} from '../../../_unstable/components/PreviewCard'
import {useDocumentPresence, useDocumentPreviewStore} from '../../../_unstable/datastores'
import {PaneItemPreview} from '../paneItem/PaneItemPreview'
import {usePaneRouter} from '../paneRouter'

const EMPTY_ARRAY: [] = []

interface ReferencePreviewLinkProps {
  onClick?: () => void
  type: SchemaType & {icon?: any}
  value: SanityDocument
}

export function ReferencePreviewLink(props: ReferencePreviewLinkProps) {
  const {onClick, type, value} = props
  const publishedId = getPublishedId(value?._id)
  const documentPresence = useDocumentPresence(publishedId)
  const documentPreviewStore = useDocumentPreviewStore()
  const {ReferenceChildLink} = usePaneRouter()

  const Link = useCallback(
    (linkProps: {children: React.ReactNode}) => (
      <ReferenceChildLink
        documentId={value?._id}
        documentType={type?.name}
        parentRefPath={EMPTY_ARRAY}
        {...linkProps}
      />
    ),
    [ReferenceChildLink, type?.name, value?._id]
  )

  return (
    <PreviewCard
      __unstable_focusRing
      as={Link}
      data-as="a"
      onClick={onClick}
      padding={2}
      radius={2}
    >
      <PaneItemPreview
        documentPreviewStore={documentPreviewStore}
        icon={type?.icon}
        layout="default"
        presence={documentPresence?.length > 0 ? documentPresence : EMPTY_ARRAY}
        schemaType={type}
        value={value}
      />
    </PreviewCard>
  )
}
