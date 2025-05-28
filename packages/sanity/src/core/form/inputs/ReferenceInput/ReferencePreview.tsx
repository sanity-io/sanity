import {type ObjectSchemaType} from '@sanity/types'
import {Badge, Box, Inline} from '@sanity/ui'
import {useMemo} from 'react'

import {type PreviewLayoutKey} from '../../../components'
import {DocumentStatus} from '../../../components/documentStatus'
import {DocumentStatusIndicator} from '../../../components/documentStatusIndicator'
import {DocumentPreviewPresence} from '../../../presence'
import {useDocumentVersionInfo} from '../../../releases'
import {useDocumentPresence} from '../../../store'
import {type RenderPreviewCallback} from '../../types'

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
}) {
  const {id, layout, refType, renderPreview, showTypeLabel} = props

  const documentPresence = useDocumentPresence(id)

  const versionsInfo = useDocumentVersionInfo(id)

  // Note: we can't pass the preview values as-is to the Preview-component here since it's a "prepared" value and the
  // Preview component expects the "raw"/unprepared value. By passing only _id and _type we make sure the Preview-component
  // resolve the preview value it needs (this is cached in the runtime, so not likely to cause any fetch overhead)
  const previewStub = useMemo(() => ({_id: id, _type: refType.name}), [id, refType.name])

  const previewProps = useMemo(
    () => ({
      children: (
        <Box paddingLeft={3}>
          <Inline space={3}>
            {showTypeLabel && <Badge mode="outline">{refType.title}</Badge>}

            {documentPresence && documentPresence.length > 0 && (
              <DocumentPreviewPresence presence={documentPresence} />
            )}

            <DocumentStatusIndicator
              draft={versionsInfo.draft}
              published={versionsInfo.published}
              versions={versionsInfo.versions}
            />
          </Inline>
        </Box>
      ),
      layout,
      schemaType: refType,
      tooltip: (
        <DocumentStatus
          draft={versionsInfo.draft}
          published={versionsInfo.published}
          versions={versionsInfo.versions}
        />
      ),
      value: previewStub,
    }),
    [
      documentPresence,
      layout,
      previewStub,
      refType,
      showTypeLabel,
      versionsInfo.draft,
      versionsInfo.published,
      versionsInfo.versions,
    ],
  )

  return renderPreview(previewProps)
}
