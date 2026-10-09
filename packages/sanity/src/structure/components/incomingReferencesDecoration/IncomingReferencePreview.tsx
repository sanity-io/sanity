import {type Path, type SanityDocument, type SchemaType} from '@sanity/types'
import {
  getPublishedId,
  pathToString,
  PreviewCard,
  useDocumentPresence,
  useDocumentPreviewStore,
} from 'sanity'

import {PaneItemPreview} from '../paneItem/PaneItemPreview'
import {usePaneRouter} from '../paneRouter/usePaneRouter'

interface IncomingReferencePreviewProps {
  type: SchemaType
  value: SanityDocument
  /**
   * Path of the field holding the reference, used to deep link to that field. It is not always
   * possible to resolve: the referencing document we have at hand may not contain the reference
   * yet, for instance when the listener is lagging behind a recently created reference.
   */
  path?: Path
}

export function IncomingReferencePreview(props: IncomingReferencePreviewProps) {
  const {type, value, path} = props
  const publishedId = getPublishedId(value?._id)
  const documentPresence = useDocumentPresence(publishedId)
  const documentPreviewStore = useDocumentPreviewStore()
  const {ChildLink} = usePaneRouter()

  return (
    <PreviewCard
      __unstable_focusRing
      as={ChildLink}
      childId={publishedId}
      childParameters={{
        type: type.name,
        ...(Array.isArray(path) && path.length > 0 ? {path: pathToString(path)} : {}),
      }}
      data-as="a"
      radius={2}
    >
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
