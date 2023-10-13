import {Box, Button, Flex, Stack, Text, Tooltip} from '@sanity/ui'
import {PlayIcon, PublishIcon} from '@sanity/icons'
import React from 'react'
import styled from 'styled-components'
import {useRelativeTime} from 'sanity'

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
  const lastPublishedTimeAgo = useRelativeTime(lastPublished || '', {
    minimal: true,
    useTemporalPhrase: true,
  })
  // Label with abbreviation and no suffix
  const lastPublishedTime = useRelativeTime(lastPublished || '', {minimal: true})

  // Label with abbreviations and suffix
  const lastUpdatedTimeAgo = useRelativeTime(lastUpdated || '', {
    minimal: true,
    useTemporalPhrase: true,
  })
  // Label with abbreviation and no suffix
  const lastUpdatedTime = useRelativeTime(lastUpdated || '', {minimal: true})

  // Accessible labels without abbreviations or suffixes
  const a11yUpdatedAgo = useRelativeTime(lastUpdated || '', {
    minimal: false,
    useTemporalPhrase: true,
  })
  const a11yPublishedAgo = useRelativeTime(lastPublished || '', {
    minimal: false,
    useTemporalPhrase: true,
  })
  const a11yLabel = liveEdit
    ? `Last updated ${a11yUpdatedAgo}`
    : `Last published ${a11yPublishedAgo}`

  return (
    <Root align="center" data-ui="SessionLayout" sizing="border">
      <Tooltip
        placement="top"
        portal
        content={
          <Stack padding={3} space={3}>
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
