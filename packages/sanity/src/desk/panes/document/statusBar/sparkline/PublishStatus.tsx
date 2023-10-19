import {Box, Button, Flex, Text} from '@sanity/ui'
import {PlayIcon, PublishIcon} from '@sanity/icons'
import React from 'react'
import styled from 'styled-components'
import {Tooltip} from '../../../../../ui'
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
        text={`${
          liveEdit
            ? `Last updated ${lastUpdated ? lastUpdatedTimeAgo : lastPublishedTimeAgo}`
            : `Last published ${lastPublishedTimeAgo}`
        }`}
        placement="top-start"
      >
        <Button
          mode="bleed"
          tone={liveEdit ? 'critical' : 'positive'}
          tabIndex={-1}
          disabled={disabled}
          aria-label={a11yLabel}
        >
          <Flex align="center">
            <Box marginRight={collapsed ? 0 : 3}>
              <Text size={2} aria-hidden="true">
                {liveEdit ? <PlayIcon /> : <PublishIcon />}
              </Text>
            </Box>
            {!collapsed && (
              <Text size={1} weight="medium">
                {liveEdit ? (
                  <abbr aria-label={a11yLabel}>
                    {lastUpdated ? lastUpdatedTime : lastPublishedTime}
                  </abbr>
                ) : (
                  <abbr aria-label={a11yLabel}>{lastPublishedTime}</abbr>
                )}
              </Text>
            )}
          </Flex>
        </Button>
      </Tooltip>
    </Root>
  )
}
