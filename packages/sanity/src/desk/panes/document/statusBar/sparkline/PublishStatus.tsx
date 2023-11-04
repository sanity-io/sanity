import {Flex, Stack, Text} from '@sanity/ui'
import {PlayIcon, PublishIcon} from '@sanity/icons'
import React from 'react'
import styled from 'styled-components'
import {Button, Tooltip} from '../../../../../ui'
import {useTimeAgo} from 'sanity'

interface PublishStatusProps {
  collapsed?: boolean
  disabled: boolean
  lastPublished?: string
  lastUpdated?: string
  liveEdit: boolean
}

const Root = styled(Flex)`
  cursor: default;
`

export function PublishStatus(props: PublishStatusProps) {
  const {collapsed, disabled, lastPublished, lastUpdated, liveEdit} = props

  // Label with abbreviations and suffix
  const lastPublishedTimeAgo = useTimeAgo(lastPublished || '', {minimal: true, agoSuffix: true})
  // Label with abbreviation and no suffix
  const lastPublishedTime = useTimeAgo(lastPublished || '', {minimal: true})

  // Label with abbreviations and suffix
  const lastUpdatedTimeAgo = useTimeAgo(lastUpdated || '', {minimal: true, agoSuffix: true})
  // Label with abbreviation and no suffix
  const lastUpdatedTime = useTimeAgo(lastUpdated || '', {minimal: true})

  // Accessible labels without abbreviations or suffixes
  const a11yUpdatedAgo = useTimeAgo(lastUpdated || '', {minimal: false, agoSuffix: true})
  const a11yPublishedAgo = useTimeAgo(lastPublished || '', {minimal: false, agoSuffix: true})
  const a11yLabel = liveEdit
    ? `Last updated ${a11yUpdatedAgo}`
    : `Last published ${a11yPublishedAgo}`

  return (
    <Root align="center" data-ui="SessionLayout" sizing="border">
      <Tooltip
        placement="top"
        portal
        content={
          <Stack space={3}>
            <Text size={1}>
              {liveEdit ? (
                <>
                  Last updated{' '}
                  <abbr aria-label={lastUpdated ? a11yUpdatedAgo : a11yPublishedAgo}>
                    {lastUpdated ? lastUpdatedTimeAgo : lastPublishedTimeAgo}
                  </abbr>
                </>
              ) : (
                <>
                  Last published <abbr aria-label={a11yPublishedAgo}>{lastPublishedTimeAgo}</abbr>
                </>
              )}
            </Text>
          </Stack>
        }
      >
        <Button
          mode="bleed"
          tone={liveEdit ? 'critical' : 'positive'}
          tabIndex={-1}
          disabled={disabled}
          aria-label={a11yLabel}
          icon={liveEdit ? PlayIcon : PublishIcon}
          text={
            collapsed ? null : (
              <abbr aria-label={a11yLabel}>
                {liveEdit && lastUpdated ? lastUpdatedTime : lastPublishedTime}
              </abbr>
            )
          }
        />
      </Tooltip>
    </Root>
  )
}
