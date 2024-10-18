import {DotIcon} from '@sanity/icons'
import {Box, Text} from '@sanity/ui'
import {type CSSProperties} from 'react'
import {type BundleDocument} from 'sanity'

import {getReleaseTone} from '../../util/getReleaseTone'

export function ReleaseAvatar({
  fontSize = 1,
  padding = 3,
  release,
}: {
  fontSize?: number
  padding?: number
  release: Partial<BundleDocument>
}) {
  const releaseTone = getReleaseTone(release)

  return (
    <Box flex="none" padding={padding} style={{borderRadius: 3}}>
      <Text size={fontSize}>
        <DotIcon
          data-testid={`release-avatar-${releaseTone}`}
          style={
            {
              '--card-icon-color': `var(--card-badge-${releaseTone}-icon-color)`,
            } as CSSProperties
          }
        />
      </Text>
    </Box>
  )
}
