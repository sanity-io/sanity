import {ErrorOutlineIcon} from '@sanity/icons/ErrorOutline'
import {InfoOutlineIcon} from '@sanity/icons/InfoOutline'
import {WarningOutlineIcon} from '@sanity/icons/WarningOutline'
import {type Path, type ValidationMarker} from '@sanity/types'
import {type ButtonTone} from '@sanity/ui'
// oxlint-disable-next-line no-restricted-imports
import {MenuItem} from '@sanity/ui/menu'
import {type CSSProperties, useCallback} from 'react'
import {Text, Box, Flex, Icon} from 'ui5'

import {wrappingText} from './ValidationListItem.css'

const MENU_ITEM_TONES: Record<'error' | 'warning' | 'info', ButtonTone> = {
  error: 'critical',
  warning: 'caution',
  info: 'primary',
}

const PRIMARY_FOREGROUND_STYLE = {
  '--text-color': 'var(--card-fg-color)',
  '--text-color-muted': 'var(--card-muted-fg-color)',
  '--icon-color': 'var(--card-fg-color)',
  '--icon-color-muted': 'var(--card-muted-fg-color)',
} as CSSProperties & {
  '--text-color': string
  '--text-color-muted': string
  '--icon-color': string
  '--icon-color-muted': string
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
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  const message = marker.message ?? marker.item?.message
  const children = (
    <Flex>
      <Box>
        {marker.level === 'error' && <Icon icon={ErrorOutlineIcon} size={1} tone="critical" />}
        {marker.level === 'warning' && <Icon icon={WarningOutlineIcon} size={1} tone="caution" />}
        {marker.level === 'info' && (
          <Icon icon={InfoOutlineIcon} size={1} style={PRIMARY_FOREGROUND_STYLE} />
        )}
      </Box>

      <Flex gap={2} flexBasis="0%" flexGrow={1} paddingLeft={3} flexDirection="column">
        {path && (
          <Text
            className={wrappingText}
            size={1}
            weight="semibold"
            as="div"
            trim={true}
            tone={
              menuItemTone === 'primary' || menuItemTone === 'default' ? undefined : menuItemTone
            }
            style={menuItemTone === 'primary' ? PRIMARY_FOREGROUND_STYLE : undefined}
          >
            {path}
          </Text>
        )}
        {message && (
          <Text
            className={wrappingText}
            muted
            size={1}
            truncate={truncate ? 1 : undefined}
            as="div"
            trim={true}
            tone={
              menuItemTone === 'primary' || menuItemTone === 'default' ? undefined : menuItemTone
            }
            style={menuItemTone === 'primary' ? PRIMARY_FOREGROUND_STYLE : undefined}
          >
            {message}
          </Text>
        )}
      </Flex>
    </Flex>
  )
  return (
    <MenuItem padding={1} onClick={handleClick} radius={2} tone={menuItemTone}>
      <Box padding={2}>{children}</Box>
    </MenuItem>
  )
}
