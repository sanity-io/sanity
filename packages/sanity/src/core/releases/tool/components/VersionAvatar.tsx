import {type IconComponent} from '@sanity/icons'
import {type BadgeTone, Box, Text} from '@sanity/ui'

import {BadgeIcon} from './BadgeIcon'

export function VersionAvatar({
  fontSize = 1,
  icon,
  padding = 3,
  tone = 'default',
}: {
  fontSize?: number
  padding?: number
  icon: IconComponent
  tone?: BadgeTone
}) {
  return (
    <Box flex="none" padding={padding} style={{borderRadius: 3}}>
      <Text size={fontSize}>
        <BadgeIcon icon={icon} tone={tone} />
      </Text>
    </Box>
  )
}
