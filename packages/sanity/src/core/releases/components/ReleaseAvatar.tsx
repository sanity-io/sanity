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

/** @internal */
export const ReleaseAvatarIcon = ({
  tone,
  release,
  releaseType,
}: {
  /**
   * @deprecated - Prefer `release` or `releaseType`.
   */
  tone?: BadgeTone
  release?: TargetPerspective
  releaseType?: ReleaseType
}) => {
  const resolvedTone =
    tone ??
    (typeof releaseType !== 'undefined'
      ? RELEASE_TYPES_TONES[releaseType]?.tone
      : typeof release !== 'undefined'
        ? isDraftPerspective(release)
          ? // special case for draft perspective, the icon needs to be caution tone
            'caution'
          : getReleaseTone(release)
        : undefined)

  if (!resolvedTone) return null

  const iconProps: {
    'data-testid': string
    'style': CSSProperties & {'--card-icon-color': string}
  } = {
    'data-testid': `release-avatar-${resolvedTone}`,
    'style': {
      '--card-icon-color': `var(--card-badge-${resolvedTone}-icon-color)`,
    },
  }

  if (releaseType === 'asap') {
    return <BoltIcon {...iconProps} />
  }
  if (releaseType === 'scheduled') {
    return <ClockIcon {...iconProps} />
  }
  if (releaseType === 'undecided') {
    return <DotIcon {...iconProps} />
  }

  if (isReleaseDocument(release)) {
    if (isPausedCardinalityOneRelease(release)) {
      return <ClockIcon {...iconProps} />
    }
    if (release?.metadata?.releaseType === 'asap') {
      return <BoltIcon {...iconProps} />
    }
    if (release?.metadata?.releaseType === 'scheduled') {
      return <ClockIcon {...iconProps} />
    }
    if (release?.metadata?.releaseType === 'undecided') {
      return <DotIcon {...iconProps} />
    }
  }
  return <DotIcon {...iconProps} />
}

type ReleaseAvatarRenderMode =
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

export function ReleaseAvatar({
  fontSize = 1,
  padding = 3,
  ...iconProps
}: ReleaseAvatarRenderMode & {
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
