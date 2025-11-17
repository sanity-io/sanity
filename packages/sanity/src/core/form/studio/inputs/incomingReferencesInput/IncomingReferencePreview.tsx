import {type Path, type SanityDocument, type SchemaType} from '@sanity/types'
import {type ComponentProps, type ForwardedRef, forwardRef, useMemo} from 'react'

import {PreviewCard} from '../../../../components/previewCard/PreviewCard'
import {pathToString} from '../../../../field/paths/helpers'
import {type FIXME} from '../../../../FIXME'
import {useDocumentPreviewStore} from '../../../../store/_legacy/datastores'
import {useDocumentPresence} from '../../../../store/_legacy/presence/useDocumentPresence'
import {getPublishedId} from '../../../../util/draftUtils'
import {useReferenceInputOptions} from '../../contexts/ReferenceInputOptions'
import {ItemPreview} from './ItemPreview'

interface IncomingReferencePreviewProps {
  type: SchemaType
  value: SanityDocument
  path: Path
}

/**
 * @internal
 */
export function IncomingReferencePreview(props: IncomingReferencePreviewProps) {
  const {type, value, path} = props
  const publishedId = getPublishedId(value?._id)
  const documentType = type.name
  const documentPresence = useDocumentPresence(publishedId)
  const documentPreviewStore = useDocumentPreviewStore()

  const {EditReferenceLinkComponent} = useReferenceInputOptions()

  const EditReferenceLink = useMemo(
    () =>
      forwardRef(function EditReferenceLink_(
        _props: ComponentProps<NonNullable<typeof EditReferenceLinkComponent>>,
        forwardedRef: ForwardedRef<'a'>,
      ) {
        return EditReferenceLinkComponent ? (
          <EditReferenceLinkComponent
            {..._props}
            ref={forwardedRef}
            documentId={publishedId}
            documentType={documentType}
            parentRefPath={[]}
            childParameters={{path: pathToString(path)}}
          />
        ) : null
      }),
    [EditReferenceLinkComponent, publishedId, documentType, path],
  )

  return (
    <PreviewCard __unstable_focusRing as={EditReferenceLink as FIXME} data-as="a" radius={2}>
      <ItemPreview
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
