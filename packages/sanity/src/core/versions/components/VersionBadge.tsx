import {ChevronDownIcon, Icon} from '@sanity/icons'
import {Box, Flex, Text} from '@sanity/ui'
import {type CSSProperties} from 'react'

import {type SanityVersionIcon} from '../types'

export function VersionBadge(
  props: Partial<SanityVersionIcon> & {openButton?: boolean; padding?: number; title?: string},
): JSX.Element {
  const {tone, icon, openButton, padding = 3, title} = props

  return (
    <Flex
      gap={padding}
      padding={padding}
      style={
        {
          '--card-fg-color': `var(--card-badge-${tone}-fg-color)`,
          '--card-icon-color': `var(--card-badge-${tone}-icon-color)`,
          'backgroundColor': `var(--card-badge-${tone}-bg-color)`,
          'borderRadius': '9999px',
        } as CSSProperties
      }
    >
      {icon && (
        <Box flex="none">
          <Text size={1}>
            <Icon symbol={icon} />
          </Text>
        </Box>
      )}
      {title && (
        <Box flex="none">
          <Text size={1}>{title}</Text>
        </Box>
      )}
      {openButton && (
        <Box flex="none">
          <Text size={1}>
            <ChevronDownIcon />
          </Text>
        </Box>
      )}
    </Flex>
  )
}
