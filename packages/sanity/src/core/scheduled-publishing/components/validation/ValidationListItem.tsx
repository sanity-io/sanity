import {ErrorOutlineIcon, InfoOutlineIcon, WarningOutlineIcon} from '@sanity/icons'
import {type Path, type ValidationMarker} from '@sanity/types'
// eslint-disable-next-line no-restricted-imports
import {Box, type ButtonTone, Flex, MenuItem, Stack, Text} from '@sanity/ui'
import {useCallback} from 'react'
import {styled} from 'styled-components'

const StyledText = styled(Text)`
  white-space: initial;
`

const MENU_ITEM_TONES: Record<'error' | 'warning' | 'info', ButtonTone> = {
  error: 'critical',
  warning: 'caution',
  info: 'primary',
}

/**
 * @internal
 */
export interface ValidationListItemProps {
  marker: ValidationMarker
  onClick?: (path?: Path) => void
  path: string
  truncate?: boolean
}

/**
 * @internal
 */
export function ValidationListItem(props: ValidationListItemProps) {
  const {marker, onClick, path, truncate} = props

  const handleClick = useCallback(() => {
    if (onClick) {
      onClick(marker.path)
    }
  }, [marker.path, onClick])

  const menuItemTone = MENU_ITEM_TONES[marker?.level] || undefined
  const message = marker.message ?? marker.item?.message
  const children = (
    <Flex>
      <Box>
        <Text size={1}>
          {marker.level === 'error' && <ErrorOutlineIcon />}
          {marker.level === 'warning' && <WarningOutlineIcon />}
          {marker.level === 'info' && <InfoOutlineIcon />}
        </Text>
      </Box>

      <Stack space={2} flex={1} paddingLeft={3}>
        {path && (
          <StyledText size={1} weight="semibold">
            {path}
          </StyledText>
        )}
        {message && (
          <StyledText muted size={1} textOverflow={truncate ? 'ellipsis' : undefined}>
            {message}
          </StyledText>
        )}
      </Stack>
    </Flex>
  )
  return (
    <MenuItem padding={1} onClick={handleClick} radius={2} tone={menuItemTone}>
      <Box padding={2}>{children}</Box>
    </MenuItem>
  )
}
