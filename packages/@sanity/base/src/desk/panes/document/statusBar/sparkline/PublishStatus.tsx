import {Box, Button, Flex, Stack, Text, Tooltip} from '@sanity/ui'
import {PlayIcon, PublishIcon} from '@sanity/icons'
import React from 'react'
import styled from 'styled-components'
import {useTimeAgo} from '../../../../../hooks'

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

  const lastPublishedTimeAgo = useTimeAgo(lastPublished || '', {minimal: true, agoSuffix: true})
  const lastPublishedTime = useTimeAgo(lastPublished || '', {minimal: true})

  const lastUpdatedTimeAgo = useTimeAgo(lastUpdated || '', {minimal: true, agoSuffix: true})
  const lastUpdatedTime = useTimeAgo(lastUpdated || '', {minimal: true})

  return (
    <Root align="center" data-ui="SessionLayout" sizing="border">
      <Tooltip
        portal
        content={
          <Stack padding={3} space={3}>
            <Text size={1} muted>
              {liveEdit ? (
                <>Last updated {lastUpdated ? lastUpdatedTimeAgo : lastPublishedTimeAgo}</>
              ) : (
                <>Last published {lastPublishedTimeAgo}</>
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
        >
          <Flex align="center">
            <Box marginRight={collapsed ? 0 : 3}>
              <Text size={2}>{liveEdit ? <PlayIcon /> : <PublishIcon />}</Text>
            </Box>
            {!collapsed && (
              <Text size={1} weight="medium">
                {liveEdit ? (
                  <>{lastUpdated ? lastUpdatedTime : lastPublishedTime}</>
                ) : (
                  lastPublishedTime
                )}
              </Text>
            )}
          </Flex>
        </Button>
      </Tooltip>
    </Root>
  )
}
