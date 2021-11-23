import React, {ComponentType, ReactNode} from 'react'

import {ObjectSchemaType} from '@sanity/types'
import {DocumentAvailability} from '@sanity/base/_internal'
import {Box, Flex, Inline, Label, Text, Tooltip, useRootTheme} from '@sanity/ui'
import {AccessDeniedIcon, EditIcon, HelpCircleIcon, PublishIcon} from '@sanity/icons'
import Preview from '../../Preview'
import {DocumentPreview} from './types'
import {TimeAgo} from './utils/TimeAgo'
import {TextWithTone} from './TextWithTone'

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

  // this provides us with a workaround for an issue with css modules (https://github.com/thysultan/stylis.js/issues/272)
  // the workaround is to write a `data-selected` prop on the <TextWithTone> component and use that instead of not()
  // When the upstream issue is fixed, removing this prop (and usage sites) should make things just work again
  // eslint-disable-next-line camelcase
  __workaround_selected?: boolean
}) {
  const {layout, refType, showTypeLabel, availability, preview, id} = props

  const theme = useRootTheme()

  const notFound = availability.reason === 'NOT_FOUND'
  const insuficcientPermissions = availability.reason === 'PERMISSION_DENIED'

  return (
    <Flex align="center">
      {availability.available ? (
        <Box flex={1}>
          <Preview type={refType} value={preview.draft || preview.published} layout={layout} />
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
        <Inline space={4}>
          {showTypeLabel && (
            <Label size={1} muted>
              {refType.title}
            </Label>
          )}
          {insuficcientPermissions || notFound ? (
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
                <TextWithTone $tone="default" size={2}>
                  <HelpCircleIcon />
                </TextWithTone>
              </Tooltip>
            </Box>
          ) : null}
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
              $tone={theme.tone === 'default' ? 'positive' : 'default'}
              size={1}
              data-selected={props.__workaround_selected ? '' : undefined}
              muted={!preview.published}
            >
              <PublishIcon />
            </TextWithTone>
          </Tooltip>
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
                $tone={theme.tone === 'default' ? 'caution' : 'default'}
                size={1}
                muted={!preview.draft}
                data-selected={props.__workaround_selected ? '' : undefined}
              >
                <EditIcon />
              </TextWithTone>
            </Tooltip>
          </Box>
        </Inline>
      </Box>
    </Flex>
  )
}
