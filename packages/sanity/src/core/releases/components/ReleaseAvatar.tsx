import {DotIcon} from '@sanity/icons'
import {Box, Text} from '@sanity/ui'
import {vars} from '@sanity/ui/css'
import {type ElementTone, type FontTextSize, type Space} from '@sanity/ui/theme'

export const ReleaseAvatarIcon = ({tone}: {tone: ElementTone}) => {
  return (
    <DotIcon
      data-testid={`release-avatar-${tone}`}
      style={{
        color: vars.color.solid[tone].bg[0],
      }}
    />
  )
}

/** @internal */
export function ReleaseAvatar({
  fontSize = 1,
  padding = 3,
  tone,
}: {
  fontSize?: FontTextSize
  padding?: Space
  tone: ElementTone
}): React.JSX.Element {
  return (
    <Box flex="none" padding={padding} style={{borderRadius: 3}}>
      <Text size={fontSize}>
        <ReleaseAvatarIcon tone={tone} />
      </Text>
    </Box>
  )
}
