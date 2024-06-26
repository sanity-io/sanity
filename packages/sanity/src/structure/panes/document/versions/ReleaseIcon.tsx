import {hues} from '@sanity/color'
import {ChevronDownIcon, Icon} from '@sanity/icons'
// eslint-disable-next-line camelcase
import {Box, Flex, Text, useTheme_v2} from '@sanity/ui'
import {rgba} from '@sanity/ui/theme'
import {type CSSProperties} from 'react'

import {type SanityReleaseIcon} from '../../../../core/util/versions/util'

export function ReleaseIcon(
  props: Partial<SanityReleaseIcon> & {openButton?: boolean; padding?: number; title?: string},
) {
  const {hue = 'gray', icon, openButton, padding = 3, title} = props
  const {color} = useTheme_v2()

  return (
    <Flex
      gap={padding}
      padding={padding}
      style={
        {
          '--card-bg-color': rgba(hues[hue][color._dark ? 700 : 300].hex, 0.2),
          '--card-fg-color': hues[hue][color._dark ? 400 : 600].hex,
          '--card-icon-color': hues[hue][color._dark ? 400 : 600].hex,
          'backgroundColor': 'var(--card-bg-color)',
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
