import {type ReleaseType} from '@sanity/client'
import {BoltIcon, ClockIcon, DotIcon} from '@sanity/icons'
import {type ElementTone, Box, Text} from '@sanity/ui'
import {getVarName, type Padding, vars} from '@sanity/ui/css'
import {type FontTextSize} from '@sanity/ui/theme'
import {type CSSProperties} from 'react'

import {type TargetPerspective} from '../../perspective/types'
import {isPausedCardinalityOneRelease} from '../../util/releaseUtils'
import {isReleaseDocument} from '../store/types'
import {RELEASE_TYPES_TONES} from '../util/const'
import {getReleaseTone} from '../util/getReleaseTone'
import {isDraftPerspective} from '../util/util'

interface IconProps {
  'data-testid': string
  'style': CSSProperties
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
      tone: ElementTone
      release?: never
      releaseType?: never
    }

const varName = getVarName(vars.color.muted.fg)

export const ReleaseAvatarIcon = ({tone, release, releaseType}: ReleaseAvatarIconProps) => {
  const resolvedTone: ElementTone =
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
      // @ts-expect-error - TODO: ui-v4-migration - Fix this
      [varName]: vars.color.tinted[resolvedTone].fg[4],
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
  fontSize?: FontTextSize
  padding?: Padding
}): React.JSX.Element {
  return (
    <Box flex="none" padding={padding} style={{borderRadius: 3}}>
      <Text size={fontSize}>
        <ReleaseAvatarIcon {...iconProps} />
      </Text>
    </Box>
  )
}
