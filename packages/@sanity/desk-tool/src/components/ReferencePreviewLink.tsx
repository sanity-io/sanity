import {PreviewCard} from '@sanity/base/components'
import {getPublishedId} from 'part:@sanity/base/util/draft-utils'
import {useDocumentPresenceUsers} from '@sanity/base/hooks'
import React, {useCallback} from 'react'
import {SanityDocument, SchemaType} from '@sanity/types'
import {usePaneRouter} from '../contexts/paneRouter'
import {PaneItemPreview} from './paneItem/PaneItemPreview'

const EMPTY_ARRAY: [] = []

interface ReferencePreviewLinkProps {
  onClick?: () => void
  type: SchemaType & {icon?: any}
  value: SanityDocument
}

export function ReferencePreviewLink(props: ReferencePreviewLinkProps) {
  const {onClick, type, value} = props
  const publishedId = getPublishedId(value?._id)
  const documentPresence = useDocumentPresenceUsers(publishedId)
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
        icon={type?.icon}
        layout="default"
        presence={documentPresence?.length > 0 ? documentPresence : EMPTY_ARRAY}
        schemaType={type}
        value={value}
      />
    </PreviewCard>
  )
}
