import {type ReleaseType} from '@sanity/client'
import {BoltIcon} from '@sanity/icons/Bolt'
import {ClockIcon} from '@sanity/icons/Clock'
import {DotIcon} from '@sanity/icons/Dot'
import {type BadgeTone, Text} from '@sanity/ui'
import {type CSSProperties} from 'react'
import {Box, type Space} from 'ui5'

import {BoltSmallIcon} from '../../components/temporary-icons/BoltSmall'
import {CircleSmallIcon} from '../../components/temporary-icons/CircleSmall'
import {CircleXsIcon} from '../../components/temporary-icons/CircleXs'
import {ClockSmallIcon} from '../../components/temporary-icons/ClockSmall'
import {RingIcon} from '../../components/temporary-icons/Ring'
import {UnknownSmallIcon} from '../../components/temporary-icons/UnknownSmall'
import {type TargetPerspective} from '../../perspective/types'
import {isAgentBundleName} from '../../store/agent/createAgentBundlesStore'
import {isPausedCardinalityOneRelease} from '../../util/releaseUtils'
import {isReleaseDocument} from '../store/types'
import {RELEASE_TYPES_TONES} from '../util/const'
import {getReleaseTone} from '../util/getReleaseTone'
import {isDraftPerspective} from '../util/util'

interface IconProps {
  'data-testid': string
  'style': CSSProperties & {'--card-icon-color': string}
}
type IconSize = 'default' | 'small'
function renderReleaseTypeIcon(
  releaseType: ReleaseType,
  iconProps: IconProps,
  size: IconSize = 'default',
) {
  switch (releaseType) {
    case 'asap':
      return size === 'default' ? <BoltIcon {...iconProps} /> : <BoltSmallIcon {...iconProps} />
    case 'scheduled':
      return size === 'default' ? <ClockIcon {...iconProps} /> : <ClockSmallIcon {...iconProps} />
    case 'undecided':
      return size === 'default' ? <DotIcon {...iconProps} /> : <UnknownSmallIcon {...iconProps} />
    default:
      return size === 'default' ? <DotIcon {...iconProps} /> : <CircleXsIcon {...iconProps} />
  }
}

/** @internal */
type ReleaseAvatarIconProps =
  | {
      release: TargetPerspective
      tone?: never
      releaseType?: never
      size?: IconSize
    }
  | {
      releaseType: ReleaseType
      tone?: never
      release?: never
      size?: IconSize
    }
  | {
      /**
       * @deprecated - Prefer `release` or `releaseType`.
       */
      tone: BadgeTone
      release?: never
      releaseType?: never
      size?: IconSize
    }

export const ReleaseAvatarIcon = ({
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  tone,
  release,
  releaseType,
  size = 'default',
}: ReleaseAvatarIconProps) => {
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
  if (isAgentBundleName(release)) return <CircleXsIcon {...iconProps} />

  if (releaseType) {
    return renderReleaseTypeIcon(releaseType, iconProps, size)
  }

  if (isReleaseDocument(release)) {
    if (isPausedCardinalityOneRelease(release)) {
      return size === 'default' ? <ClockIcon {...iconProps} /> : <ClockSmallIcon {...iconProps} />
    }

    return renderReleaseTypeIcon(release.metadata.releaseType, iconProps, size)
  }

  if (release && isDraftPerspective(release)) {
    return size === 'default' ? <DotIcon {...iconProps} /> : <RingIcon {...iconProps} />
  }

  return size === 'default' ? <DotIcon {...iconProps} /> : <CircleSmallIcon {...iconProps} />
}

export function ReleaseAvatar({
  fontSize = 1,
  padding = 3,
  ...iconProps
}: ReleaseAvatarIconProps & {
  fontSize?: number
  padding?: Space
}): React.JSX.Element {
  return (
    <Box flexBasis="auto" flexGrow={0} flexShrink={0} padding={padding} style={{borderRadius: 3}}>
      <Text size={fontSize}>
        <ReleaseAvatarIcon {...iconProps} />
      </Text>
    </Box>
  )
}
