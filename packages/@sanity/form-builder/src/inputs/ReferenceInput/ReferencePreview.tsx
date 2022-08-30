import React, {ComponentType, ReactNode, useMemo} from 'react'

import {ObjectSchemaType} from '@sanity/types'
import {DocumentAvailability} from '@sanity/base/_internal'
import {Box, Flex, Inline, Label, Text, Tooltip, useRootTheme} from '@sanity/ui'
import {AccessDeniedIcon, EditIcon, HelpCircleIcon, PublishIcon} from '@sanity/icons'
import {TextWithTone} from '@sanity/base/components'
import {DocumentPreviewPresence} from '@sanity/base/presence'
import {useDocumentPresenceUsers} from '@sanity/base/hooks'
import Preview from '../../Preview'
import {DocumentPreview} from './types'
import {TimeAgo} from './utils/TimeAgo'

function UnavailableMessage(props: {icon: ComponentType; children: ReactNode; title: ReactNode}) {
  const Icon = props.icon
  return (
    <Flex padding={3}>
      <Box>
        <Text size={1}>
          <Icon />
        </Text>
      </Box>
      <Box flex={1} marginLeft={3}>
        <Text size={1} weight="semibold">
          {props.title}
        </Text>

        <Box marginTop={3}>
          <Text as="p" muted size={1}>
            {props.children}
          </Text>
        </Box>
      </Box>
    </Flex>
  )
}

/**
 * Used to preview a referenced type
 * Takes the reference type as props
 * @param props
 * @constructor
 */
export function ReferencePreview(props: {
  availability: DocumentAvailability
  id: string
  preview: {draft: DocumentPreview | undefined; published: DocumentPreview | undefined}
  refType: ObjectSchemaType
  layout: string
  showTypeLabel: boolean
}) {
  const {availability, id, layout, preview, refType, showTypeLabel} = props

  const theme = useRootTheme()
  const documentPresence = useDocumentPresenceUsers(id)

  const notFound = availability.reason === 'NOT_FOUND'
  const insufficientPermissions = availability.reason === 'PERMISSION_DENIED'

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
  const previewStub = useMemo(() => ({_id: previewId, _type: refType.name}), [
    previewId,
    refType.name,
  ])

  return (
    <Flex align="center">
      {availability.available ? (
        <Box flex={1}>
          <Preview type={refType} value={previewStub} layout={layout} />
        </Box>
      ) : (
        <Box flex={1}>
          <Flex align="center">
            <Box flex={1} paddingY={2}>
              <Text muted>Document unavailable</Text>
            </Box>
          </Flex>
        </Box>
      )}

      <Box paddingLeft={3}>
        <Inline space={3}>
          {showTypeLabel && (
            <Label size={1} muted>
              {refType.title}
            </Label>
          )}

          {insufficientPermissions || notFound ? (
            <Box>
              <Tooltip
                portal
                content={
                  notFound ? (
                    <UnavailableMessage title="Not found" icon={HelpCircleIcon}>
                      The referenced document does not exist
                      <br />
                      (id: <code>{id}</code>)
                    </UnavailableMessage>
                  ) : (
                    <UnavailableMessage title="Insufficcient permissions" icon={AccessDeniedIcon}>
                      The referenced document could not be accessed due to insufficient permissions
                    </UnavailableMessage>
                  )
                }
              >
                <TextWithTone tone="default">
                  <HelpCircleIcon />
                </TextWithTone>
              </Tooltip>
            </Box>
          ) : null}

          {documentPresence && documentPresence.length > 0 && (
            <DocumentPreviewPresence presence={documentPresence} />
          )}
          <Inline space={4}>
            <Box>
              <Tooltip
                content={
                  <Box padding={2}>
                    <Text size={1}>
                      {preview.published ? (
                        <>
                          Published <TimeAgo time={preview.published._updatedAt} />
                        </>
                      ) : (
                        <>Not published</>
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
                  <PublishIcon />
                </TextWithTone>
              </Tooltip>
            </Box>

            <Box>
              <Tooltip
                content={
                  <Box padding={2}>
                    <Text size={1}>
                      {preview.draft ? (
                        <>
                          Edited <TimeAgo time={preview.draft?._updatedAt} />
                        </>
                      ) : (
                        <>No unpublished edits</>
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
                  <EditIcon />
                </TextWithTone>
              </Tooltip>
            </Box>
          </Inline>
        </Inline>
      </Box>
    </Flex>
  )
}
