import {DotIcon} from '@sanity/icons'
import {type BadgeTone, Box, Text} from '@sanity/ui'
import {type CSSProperties} from 'react'

export const ReleaseAvatarIcon = ({tone}: {tone: BadgeTone}) => {
  return (
    <DotIcon
      data-testid={`release-avatar-${tone}`}
      style={
        {
          '--card-icon-color': `var(--card-badge-${tone}-icon-color)`,
        } as CSSProperties
      }
    />
  )
}

/** @internal */
export function ReleaseAvatar({
  fontSize = 1,
  padding = 3,
  tone,
}: {
  fontSize?: number
  padding?: number
  tone: BadgeTone
}): React.JSX.Element {
  return (
    <Box flex="none" padding={padding} style={{borderRadius: 3}}>
      <Text size={fontSize}>
        <ReleaseAvatarIcon tone={tone} />
      </Text>
    </Box>
  )
}
