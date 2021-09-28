import {Box, Button, Flex, Text} from '@sanity/ui'
import {PlayIcon, PublishIcon} from '@sanity/icons'
import React from 'react'
import styled from 'styled-components'

interface PublishStatusProps {
  disabled: boolean
  lastPublishedTimeAgo: string
  lastUpdated?: string | null
  lastUpdatedTimeAgo: string
  liveEdit: boolean
}

const Root = styled(Flex)`
  cursor: default;
`

export function PublishStatus(props: PublishStatusProps) {
  const {disabled, lastPublishedTimeAgo, lastUpdated, lastUpdatedTimeAgo, liveEdit} = props

  return (
    <Root align="center" data-ui="SessionLayout" sizing="border">
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
            {liveEdit && <>{lastUpdated ? lastUpdatedTimeAgo : lastPublishedTimeAgo}</>}
            {!liveEdit && lastPublishedTimeAgo}
          </Text>
        </Flex>
      </Button>
    </Root>
  )
}
