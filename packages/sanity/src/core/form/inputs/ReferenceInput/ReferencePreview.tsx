import {type ObjectSchemaType} from '@sanity/types'
import {Badge, Inline} from '@sanity/ui'
import {useMemo} from 'react'
import {Box} from 'ui5'

import {
  DocumentVersionsMarksFlyout,
  REFERENCE_MARKS_SURFACE,
} from '../../../components/documentStatus/DocumentVersionsMarksFlyout'
import {DocumentVersionsStatus} from '../../../components/documentStatus/DocumentVersionsStatus'
import {DocumentVersionsStatusIndicator} from '../../../components/documentStatusIndicator/DocumentVersionsStatusIndicator'
import {type PreviewLayoutKey} from '../../../components/previews/types'
import {DocumentPreviewPresence} from '../../../presence/DocumentPreviewPresence'
import {useDocumentVersions} from '../../../releases/hooks/useDocumentVersions'
import {useDocumentPresence} from '../../../store/presence/useDocumentPresence'
import {useWorkspace} from '../../../studio/workspace'
import {type RenderPreviewCallback} from '../../types/renderCallback'

/**
 * Used to preview a referenced type
 * Takes the reference type as props
 */
export function ReferencePreview(props: {
  id: string
  refType: ObjectSchemaType
  layout: PreviewLayoutKey
  renderPreview: RenderPreviewCallback
  showTypeLabel?: boolean
  /**
   * Whether the status marks may open the versions flyout (with the document group inventory
   * enabled), in place of the read-only versions tooltip on the preview. Set for the field's own
   * value, not for the options of its search.
   */
  versionsFlyout?: boolean
}) {
  const {id, layout, refType, renderPreview, showTypeLabel, versionsFlyout = false} = props
  const inventoryEnabled = useWorkspace().beta?.documentGroupInventory?.enabled === true
  const withFlyout = versionsFlyout && inventoryEnabled

  const documentPresence = useDocumentPresence(id)

  const {versions} = useDocumentVersions({documentId: id})

  // Note: we can't pass the preview values as-is to the Preview-component here since it's a "prepared" value and the
  // Preview component expects the "raw"/unprepared value. By passing only _id and _type we make sure the Preview-component
  // resolve the preview value it needs (this is cached in the runtime, so not likely to cause any fetch overhead)
  const previewStub = useMemo(() => ({_id: id, _type: refType.name}), [id, refType.name])

  const previewProps = useMemo(
    () => ({
      children: (
        <Box paddingLeft={3}>
          <Inline gap={3}>
            {showTypeLabel && <Badge>{refType.title}</Badge>}

            {documentPresence && documentPresence.length > 0 && (
              <DocumentPreviewPresence presence={documentPresence} />
            )}

            {/* The variant diamond is for document lists and search results only */}
            {withFlyout ? (
              <DocumentVersionsMarksFlyout
                documentId={id}
                documentType={refType.name}
                presence={documentPresence}
                surface={REFERENCE_MARKS_SURFACE}
                versionCount={versions.length}
              >
                <DocumentVersionsStatusIndicator documentVersions={versions} variantMarks={false} />
              </DocumentVersionsMarksFlyout>
            ) : (
              <DocumentVersionsStatusIndicator documentVersions={versions} variantMarks={false} />
            )}
          </Inline>
        </Box>
      ),
      layout,
      schemaType: refType,
      // With the flyout on the marks, the read-only tooltip goes: it opened below the reference,
      // over the next item and the next field
      tooltip: withFlyout ? undefined : <DocumentVersionsStatus documentGroupId={id} />,
      value: previewStub,
    }),
    [documentPresence, id, layout, previewStub, refType, showTypeLabel, versions, withFlyout],
  )

  return renderPreview(previewProps)
}
