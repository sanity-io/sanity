import {type SanityDocument, type SchemaType} from '@sanity/types'
import {type ReactNode, useCallback} from 'react'
import {
  type FIXME,
  getPublishedId,
  PreviewCard,
  useDocumentPresence,
  useDocumentPreviewStore,
} from 'sanity'

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
    function LinkComponent(linkProps: {children: ReactNode}) {
      return (
        <ReferenceChildLink
          documentId={value?._id}
          documentType={type?.name}
          parentRefPath={EMPTY_ARRAY}
          {...linkProps}
        />
      )
    },
    [ReferenceChildLink, type?.name, value?._id],
  )

  return (
    <PreviewCard __unstable_focusRing as={Link as FIXME} data-as="a" onClick={onClick} radius={2}>
      <PaneItemPreview
        documentPreviewStore={documentPreviewStore}
        icon={type?.icon}
        layout="compact"
        presence={documentPresence?.length > 0 ? documentPresence : EMPTY_ARRAY}
        schemaType={type}
        value={value}
      />
    </PreviewCard>
  )
}
