import React, {useMemo} from 'react'
import {ObjectSchemaType} from '@sanity/types'
import {Badge, Box, Inline} from '@sanity/ui'
import {DocumentStatus} from '../../../../ui/documentStatus'
import {PreviewLayoutKey} from '../../../components'
import {RenderPreviewCallback} from '../../types'
import {useDocumentPresence} from '../../../store'
import {DocumentPreviewPresence} from '../../../presence'
import {useDocumentStatusTimeAgo} from '../../../hooks'
import {ReferenceInfo} from './types'

/**
 * Used to preview a referenced type
 * Takes the reference type as props
 */
export function ReferencePreview(props: {
  id: string
  preview: ReferenceInfo['preview']
  refType: ObjectSchemaType
  layout: PreviewLayoutKey
  renderPreview: RenderPreviewCallback
  showTypeLabel?: boolean
}) {
  const {id, layout, preview, refType, renderPreview, showTypeLabel} = props

  const documentPresence = useDocumentPresence(id)

  const previewId =
    preview.draft?._id ||
    preview.published?._id ||
    // note: during publish of the referenced document we might have both a missing draft and a missing published version
    // this happens because the preview system tries to optimistically re-fetch as soon as it sees a mutation, but
    // when publishing, the draft is deleted, and therefore both the draft and the published may be missing for a brief
    // moment before the published version appears. In this case, it's safe to fallback to the given id, which is always
    // the published id
    id

  // Note: we can't pass the preview values as-is to the Preview-component here since it's a "prepared" value and the
  // Preview component expects the "raw"/unprepared value. By passing only _id and _type we make sure the Preview-component
  // resolve the preview value it needs (this is cached in the runtime, so not likely to cause any fetch overhead)
  const previewStub = useMemo(
    () => ({_id: previewId, _type: refType.name}),
    [previewId, refType.name],
  )

  const {draft, published} = preview
  const tooltipLabel = useDocumentStatusTimeAgo({draft, published})

  const previewProps = useMemo(
    () => ({
      children: (
        <Box paddingLeft={3}>
          <Inline space={3}>
            {showTypeLabel && <Badge mode="outline">{refType.title}</Badge>}

            {documentPresence && documentPresence.length > 0 && (
              <DocumentPreviewPresence presence={documentPresence} />
            )}

            <DocumentStatus draft={preview.draft} published={preview.published} />
          </Inline>
        </Box>
      ),
      layout,
      schemaType: refType,
      tooltipLabel,
      value: previewStub,
    }),
    [
      documentPresence,
      layout,
      preview.draft,
      preview.published,
      previewStub,
      refType,
      showTypeLabel,
      tooltipLabel,
    ],
  )

  return renderPreview(previewProps)
}
