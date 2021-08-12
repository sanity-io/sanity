import {Box, Flex, Text} from '@sanity/ui'
import {PlayIcon, PublishIcon} from '@sanity/icons'
import React from 'react'
import styled from 'styled-components'
import {IconBadge} from './iconBadge'

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
    <Root align="center" data-ui="SessionLayout" padding={2} sizing="border">
      {liveEdit && <IconBadge disabled={disabled} icon={PlayIcon} tone="critical" />}
      {!liveEdit && <IconBadge disabled={disabled} icon={PublishIcon} tone="positive" />}

      <Box flex={1} marginLeft={2}>
        <Text muted size={0} weight="semibold">
          Published
        </Text>

        <Box marginTop={1}>
          <Text muted size={0}>
            {liveEdit && <>{lastUpdated ? lastUpdatedTimeAgo : lastPublishedTimeAgo}</>}
            {!liveEdit && lastPublishedTimeAgo}
          </Text>
        </Box>
      </Box>
    </Root>
  )
}
