import React from 'react'

import {ObjectSchemaType} from '@sanity/types'
import {getDraftId} from '@sanity/base/_internal'
import {Box, Flex, Inline, Label, Text, Tooltip, useRootTheme} from '@sanity/ui'
import {EditIcon, PublishIcon} from '@sanity/icons'
import Preview from '../../../Preview'
import {ReferenceInfo} from '../../../inputs/ReferenceInput/types'
import {TimeAgo} from '../../../inputs/ReferenceInput/utils/TimeAgo'
import {TextWithTone} from './TextWithTone'

/**
 * Used to preview a referenced type
 * Takes the reference type as props
 * @param props
 * @constructor
 */
export function ReferencePreview(props: {
  referenceInfo: ReferenceInfo
  refType: ObjectSchemaType
  layout: string
  showTypeLabel: boolean

  // this provides us with a workaround for an issue with css modules (https://github.com/thysultan/stylis.js/issues/272)
  // the workaround is to write a `data-selected` prop on the <TextWithTone> component and use that instead of not()
  // When the upstream issue is fixed, removing this prop (and usage sites) should make things just work again
  // eslint-disable-next-line camelcase
  __workaround_selected?: boolean
}) {
  const {layout, refType, showTypeLabel, referenceInfo} = props

  const theme = useRootTheme()

  const stub = {
    _id: referenceInfo.draft.availability.available
      ? getDraftId(referenceInfo.id)
      : referenceInfo.id,
    _type: refType.name,
  }

  return (
    <Flex align="center">
      <Box flex={1}>
        <Preview type={refType} value={stub} layout={layout} />
      </Box>
      <Box marginLeft={4} marginRight={2}>
        <Inline space={4}>
          {showTypeLabel && (
            <Label size={1} muted>
              {refType.title}
            </Label>
          )}
          {referenceInfo?.published.preview && (
            <Tooltip
              content={
                <Box padding={2}>
                  <Text size={1}>
                    Published <TimeAgo time={referenceInfo.published.preview._updatedAt} />
                  </Text>
                </Box>
              }
            >
              <TextWithTone
                $tone={theme.tone === 'default' ? 'positive' : 'default'}
                size={1}
                data-selected={props.__workaround_selected ? '' : undefined}
              >
                <PublishIcon />
              </TextWithTone>
            </Tooltip>
          )}
          {referenceInfo?.draft.preview && (
            <Tooltip
              content={
                <Box padding={2}>
                  <Text size={1}>
                    Edited <TimeAgo time={referenceInfo.draft.preview._updatedAt} />
                  </Text>
                </Box>
              }
            >
              <TextWithTone
                $tone={theme.tone === 'default' ? 'caution' : 'default'}
                size={1}
                data-selected={props.__workaround_selected ? '' : undefined}
              >
                <EditIcon />
              </TextWithTone>
            </Tooltip>
          )}
        </Inline>
      </Box>
    </Flex>
  )
}
