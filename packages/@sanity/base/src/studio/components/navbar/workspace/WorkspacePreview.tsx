import {CheckmarkIcon} from '@sanity/icons'
import {Flex, Stack, Box, Text, Card} from '@sanity/ui'
import React from 'react'
import styled, {css} from 'styled-components'

export const MediaCard = styled(Card)(({color}: {color?: string}) => {
  return css`
    /* @todo: figure out what color to use */
    background-color: ${color || 'magenta'};
    width: 27px;
    height: 27px;
  `
})

interface WorkspacePreviewProps {
  color?: string
  selected?: boolean
  subtitle?: string
  title: string
}

export function WorkspacePreview(props: WorkspacePreviewProps) {
  const {color, selected, subtitle, title} = props

  return (
    <Flex align="center" flex="none">
      <MediaCard radius={2} color={color} />

      <Stack flex={1} paddingLeft={2} space={1}>
        <Text size={1} textOverflow="ellipsis" weight="semibold">
          {title}
        </Text>

        {subtitle && (
          <Text muted size={1} textOverflow="ellipsis">
            {subtitle}
          </Text>
        )}
      </Stack>

      <Box paddingLeft={3} paddingRight={1}>
        <Text hidden={!selected} size={1}>
          <CheckmarkIcon />
        </Text>
      </Box>
    </Flex>
  )
}
