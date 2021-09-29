import {Box, Button, Flex, Stack, Text, Tooltip} from '@sanity/ui'
import {PlayIcon, PublishIcon} from '@sanity/icons'
import React from 'react'
import styled from 'styled-components'

interface PublishStatusProps {
  disabled: boolean
  lastPublishedTimeAgo: string
  lastPublishedTime: string
  lastUpdated?: string | null
  lastUpdatedTimeAgo: string
  liveEdit: boolean
}

const Root = styled(Flex)`
  cursor: default;
`

export function PublishStatus(props: PublishStatusProps) {
  const {
    disabled,
    lastPublishedTimeAgo,
    lastPublishedTime,
    lastUpdated,
    lastUpdatedTimeAgo,
    liveEdit,
  } = props

  return (
    <Root align="center" data-ui="SessionLayout" sizing="border">
      <Tooltip
        content={
          <Stack padding={3} space={3}>
            <Text size={1} weight="semibold">
              Show last published version
            </Text>
            <Text size={1} muted>
              Published {lastPublishedTimeAgo}
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
            <Box marginRight={3}>
              <Text size={3}>
                {liveEdit && <PlayIcon />}
                {!liveEdit && <PublishIcon />}
              </Text>
            </Box>
            <Text size={1} weight="medium">
              {liveEdit && <>{lastUpdated ? lastUpdatedTimeAgo : lastPublishedTime}</>}
              {!liveEdit && lastPublishedTime}
            </Text>
          </Flex>
        </Button>
      </Tooltip>
    </Root>
  )
}
