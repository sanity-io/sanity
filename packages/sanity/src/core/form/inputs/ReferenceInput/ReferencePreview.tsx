import {type ObjectSchemaType} from '@sanity/types'
import {Badge, Inline} from '@sanity/ui'
import {useMemo} from 'react'
import {Box} from 'ui5'

import {DocumentVersionsMarks} from '../../../components/documentStatus/DocumentVersionsMarks'
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
   * With the document group inventory enabled: no versions tooltip on the preview (it opened below
   * the reference, over the next item and the next field), and the marks carry a spoken summary of
   * the versions instead. Set for the field's own value, not for the options of its search.
   */
  quietVersionsStatus?: boolean
}) {
  const {id, layout, refType, renderPreview, showTypeLabel, quietVersionsStatus = false} = props
  const inventoryEnabled = useWorkspace().beta?.documentGroupInventory?.enabled === true
  const quiet = quietVersionsStatus && inventoryEnabled

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

            {/* While a variant is picked, the diamond says whether the referenced document has its
                own version for it (filled) or shows Default (outline), as in lists and search */}
            {quiet ? (
              <DocumentVersionsMarks versionCount={versions.length}>
                <DocumentVersionsStatusIndicator documentVersions={versions} />
              </DocumentVersionsMarks>
            ) : (
              <DocumentVersionsStatusIndicator documentVersions={versions} />
            )}
          </Inline>
        </Box>
      ),
      layout,
      schemaType: refType,
      tooltip: quiet ? undefined : <DocumentVersionsStatus documentGroupId={id} />,
      value: previewStub,
    }),
    [documentPresence, id, layout, previewStub, quiet, refType, showTypeLabel, versions],
  )

  return renderPreview(previewProps)
}
