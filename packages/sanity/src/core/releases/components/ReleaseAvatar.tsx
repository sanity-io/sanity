import {type ReleaseType} from '@sanity/client'
import {BoltIcon, ClockIcon, DotIcon} from '@sanity/icons'
import {type BadgeTone, Box, Text} from '@sanity/ui'
import {type CSSProperties} from 'react'

import {type TargetPerspective} from '../../perspective/types'
import {isPausedCardinalityOneRelease} from '../../util/releaseUtils'
import {isReleaseDocument} from '../store/types'
import {RELEASE_TYPES_TONES} from '../util/const'
import {getReleaseTone} from '../util/getReleaseTone'
import {isDraftPerspective} from '../util/util'

interface IconProps {
  'data-testid': string
  'style': CSSProperties & {'--card-icon-color': string}
}
function renderReleaseTypeIcon(releaseType: ReleaseType, iconProps: IconProps) {
  if (releaseType === 'asap') return <BoltIcon {...iconProps} />
  if (releaseType === 'scheduled') return <ClockIcon {...iconProps} />
  return <DotIcon {...iconProps} />
}

/** @internal */
type ReleaseAvatarIconProps =
  | {
      release: TargetPerspective
      tone?: never
      releaseType?: never
    }
  | {
      releaseType: ReleaseType
      tone?: never
      release?: never
    }
  | {
      /**
       * @deprecated - Prefer `release` or `releaseType`.
       */
      tone: BadgeTone
      release?: never
      releaseType?: never
    }

export const ReleaseAvatarIcon = ({tone, release, releaseType}: ReleaseAvatarIconProps) => {
  const resolvedTone =
    tone ??
    (releaseType
      ? RELEASE_TYPES_TONES[releaseType]?.tone
      : release
        ? isDraftPerspective(release)
          ? // special case for draft perspective, the icon needs to be caution tone
            'caution'
          : getReleaseTone(release)
        : 'default')

  const iconProps: IconProps = {
    'data-testid': `release-avatar-${resolvedTone}`,
    'style': {
      '--card-icon-color': `var(--card-badge-${resolvedTone}-icon-color)`,
    },
  }

  if (releaseType) {
    return renderReleaseTypeIcon(releaseType, iconProps)
  }

  if (isReleaseDocument(release)) {
    if (isPausedCardinalityOneRelease(release)) {
      return <ClockIcon {...iconProps} />
    }

    return renderReleaseTypeIcon(release.metadata.releaseType, iconProps)
  }
  return <DotIcon {...iconProps} />
}

export function ReleaseAvatar({
  fontSize = 1,
  padding = 3,
  ...iconProps
}: ReleaseAvatarIconProps & {
  fontSize?: number
  padding?: number
}): React.JSX.Element {
  return (
    <Box flex="none" padding={padding} style={{borderRadius: 3}}>
      <Text size={fontSize}>
        <ReleaseAvatarIcon {...iconProps} />
      </Text>
    </Box>
  )
}
