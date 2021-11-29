import type {Marker, Path} from '@sanity/types'
import React, {useCallback} from 'react'
import {WarningOutlineIcon, ErrorOutlineIcon} from '@sanity/icons'
import {Box, Text, MenuItem, Stack, Flex} from '@sanity/ui'
import styled from 'styled-components'

interface ValidationListItemProps {
  marker: Marker
  onClick?: (path?: Path) => void
  path: string
  truncate?: boolean
}

const StyledText = styled(Text)`
  white-space: initial;
`

export function ListItem(props: ValidationListItemProps) {
  const {marker, onClick, path, truncate} = props

  const tone = marker.level === 'warning' ? 'caution' : 'critical'

  const handleClick = useCallback(() => {
    if (onClick) {
      onClick(marker.path)
    }
  }, [marker.path, onClick])

  const children = (
    <Flex>
      <Box>
        <Text size={1}>
          {marker.level === 'error' && <ErrorOutlineIcon />}
          {marker.level === 'warning' && <WarningOutlineIcon />}
        </Text>
      </Box>

      <Stack space={2} flex={1} paddingLeft={3}>
        {path && (
          <StyledText size={1} weight="semibold">
            {path}
          </StyledText>
        )}
        {marker.item.message && (
          <StyledText muted size={1} textOverflow={truncate ? 'ellipsis' : undefined}>
            {marker.item.message}
          </StyledText>
        )}
      </Stack>
    </Flex>
  )
  return (
    <MenuItem padding={1} onClick={handleClick} radius={2} tone={tone}>
      <Box padding={2}>{children}</Box>
    </MenuItem>
  )
}
