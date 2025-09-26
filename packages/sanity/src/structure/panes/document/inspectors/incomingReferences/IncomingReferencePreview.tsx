import {type Path, type SanityDocument, type SchemaType} from '@sanity/types'
import {type ReactNode, useCallback} from 'react'
import {
  type FIXME,
  getPublishedId,
  pathToString,
  PreviewCard,
  useDocumentPresence,
  useDocumentPreviewStore,
} from 'sanity'

import {PaneItemPreview} from '../../../../components/paneItem/PaneItemPreview'
import {usePaneRouter} from '../../../../components/paneRouter'

interface IncomingReferencePreviewProps {
  onClick?: () => void
  type: SchemaType
  value: SanityDocument
  path: Path
}

export function IncomingReferencePreview(props: IncomingReferencePreviewProps) {
  const {onClick, type, value, path} = props
  const publishedId = getPublishedId(value?._id)
  const documentPresence = useDocumentPresence(publishedId)
  const documentPreviewStore = useDocumentPreviewStore()
  const {ChildLink} = usePaneRouter()

  const Link = useCallback(
    function LinkComponent(linkProps: {children: ReactNode}) {
      return (
        <ChildLink
          childId={getPublishedId(value?._id)}
          childParameters={{type: type?.name, path: pathToString(path)}}
          {...linkProps}
        />
      )
    },
    [ChildLink, type.name, value?._id, path],
  )

  return (
    <PreviewCard __unstable_focusRing as={Link as FIXME} data-as="a" onClick={onClick} radius={2}>
      <PaneItemPreview
        documentPreviewStore={documentPreviewStore}
        icon={type.icon || false}
        layout="default"
        presence={documentPresence}
        schemaType={type}
        value={value}
      />
    </PreviewCard>
  )
}
