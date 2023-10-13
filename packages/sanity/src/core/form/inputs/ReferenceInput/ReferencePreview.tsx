import React, {useMemo} from 'react'
import {ObjectSchemaType} from '@sanity/types'
import {Box, Flex, Inline, Label, Text, Tooltip, useRootTheme} from '@sanity/ui'
import {EditIcon, PublishIcon} from '@sanity/icons'
import {RelativeTime} from '../../../components/RelativeTime'
import {Translate, useTranslation} from '../../../i18n'
import {RenderPreviewCallback} from '../../types'
import {PreviewLayoutKey, TextWithTone} from '../../../components'
import {useDocumentPresence} from '../../../store'
import {DocumentPreviewPresence} from '../../../presence'
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

  const {t} = useTranslation()
  const theme = useRootTheme()
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

  const previewProps = useMemo(
    () => ({
      layout,
      schemaType: refType,
      value: previewStub,
    }),
    [layout, previewStub, refType],
  )

  const publishedAt = preview.published?._updatedAt
  const draftEditedAt = preview.draft?._updatedAt

  return (
    <Flex align="center">
      <Box flex={1}>{renderPreview(previewProps)}</Box>

      <Box paddingLeft={3}>
        <Inline space={3}>
          {showTypeLabel && (
            <Label size={1} muted>
              {refType.title}
            </Label>
          )}

          {documentPresence && documentPresence.length > 0 && (
            <DocumentPreviewPresence presence={documentPresence} />
          )}

          <Inline space={4}>
            <Box>
              <Tooltip
                portal
                content={
                  <Box padding={2}>
                    <Text size={1}>
                      {publishedAt ? (
                        <Translate
                          t={t}
                          i18nKey="inputs.reference.preview.published-at-time"
                          components={{
                            RelativeTime: () => (
                              <RelativeTime time={publishedAt} useTemporalPhrase />
                            ),
                          }}
                        />
                      ) : (
                        <>{t('inputs.reference.preview.not-published')}</>
                      )}
                    </Text>
                  </Box>
                }
              >
                <TextWithTone
                  tone={theme.tone === 'default' ? 'positive' : 'default'}
                  size={1}
                  dimmed={!preview.published}
                  muted={!preview.published}
                >
                  <PublishIcon
                    aria-label={
                      preview.published
                        ? t('inputs.reference.preview.is-published-aria-label')
                        : t('inputs.reference.preview.is-not-published-aria-label')
                    }
                  />
                </TextWithTone>
              </Tooltip>
            </Box>

            <Box>
              <Tooltip
                portal
                content={
                  <Box padding={2}>
                    <Text size={1}>
                      {draftEditedAt ? (
                        <Translate
                          t={t}
                          i18nKey="inputs.reference.preview.edited-at-time"
                          components={{
                            RelativeTime: () => (
                              <RelativeTime time={draftEditedAt} useTemporalPhrase />
                            ),
                          }}
                        />
                      ) : (
                        <>{t('inputs.reference.preview.no-unpublished-edits')}</>
                      )}
                    </Text>
                  </Box>
                }
              >
                <TextWithTone
                  tone={theme.tone === 'default' ? 'caution' : 'default'}
                  size={1}
                  dimmed={!preview.draft}
                  muted={!preview.draft}
                >
                  <EditIcon
                    aria-label={
                      preview.draft
                        ? t('inputs.reference.preview.has-unpublished-changes-aria-label')
                        : t('inputs.reference.preview.has-no-unpublished-changes-aria-label')
                    }
                  />
                </TextWithTone>
              </Tooltip>
            </Box>
          </Inline>
        </Inline>
      </Box>
    </Flex>
  )
}
