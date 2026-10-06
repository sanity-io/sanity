import {type ReleaseType} from '@sanity/client'
import {BoltIcon} from '@sanity/icons/Bolt'
import {ClockIcon} from '@sanity/icons/Clock'
import {DotIcon} from '@sanity/icons/Dot'
import {type BadgeTone} from '@sanity/ui'
import {type CSSProperties} from 'react'
import {Flex, Icon, type IconProps as UIIconProps, type Space} from 'ui5'

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
import {releaseAvatarIcon} from './ReleaseAvatar.css'

interface IconProps {
  'data-testid': string
  'className': string
  'style': CSSProperties & {'--card-icon-color': string; '--icon-color': string}
  'size': UIIconProps['size']
}
type IconSize = 'default' | 'small'
function renderReleaseTypeIcon(
  releaseType: ReleaseType,
  iconProps: IconProps,
  size: IconSize = 'default',
) {
  switch (releaseType) {
    case 'asap':
      return size === 'default' ? (
        <Icon icon={BoltIcon} {...iconProps} />
      ) : (
        <Icon icon={BoltSmallIcon} {...iconProps} />
      )
    case 'scheduled':
      return size === 'default' ? (
        <Icon icon={ClockIcon} {...iconProps} />
      ) : (
        <Icon icon={ClockSmallIcon} {...iconProps} />
      )
    case 'undecided':
      return size === 'default' ? (
        <Icon icon={DotIcon} {...iconProps} />
      ) : (
        <Icon icon={UnknownSmallIcon} {...iconProps} />
      )
    default:
      return size === 'default' ? (
        <Icon icon={DotIcon} {...iconProps} />
      ) : (
        <Icon icon={CircleXsIcon} {...iconProps} />
      )
  }
}

/** @internal */
type ReleaseAvatarIconProps =
  | {
      release: TargetPerspective
      tone?: never
      releaseType?: never
      size?: IconSize
      fontSize?: UIIconProps['size']
    }
  | {
      releaseType: ReleaseType
      tone?: never
      release?: never
      size?: IconSize
      fontSize?: UIIconProps['size']
    }
  | {
      /**
       * @deprecated - Prefer `release` or `releaseType`.
       */
      tone: BadgeTone
      release?: never
      releaseType?: never
      size?: IconSize
      fontSize?: UIIconProps['size']
    }

export const ReleaseAvatarIcon = ({
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  tone,
  release,
  releaseType,
  size = 'default',
  fontSize = 1,
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
    'className': releaseAvatarIcon,
    'style': {
      '--card-icon-color': `var(--card-badge-${resolvedTone}-icon-color)`,
      '--icon-color': `var(--card-badge-${resolvedTone}-icon-color)`,
      'margin': fontSize === 2 ? '-0.4375rem' : '-0.375rem',
    },
    'size': fontSize,
  }
  if (isAgentBundleName(release)) return <Icon icon={CircleXsIcon} {...iconProps} />

  if (releaseType) {
    return renderReleaseTypeIcon(releaseType, iconProps, size)
  }

  if (isReleaseDocument(release)) {
    if (isPausedCardinalityOneRelease(release)) {
      return size === 'default' ? (
        <Icon icon={ClockIcon} {...iconProps} />
      ) : (
        <Icon icon={ClockSmallIcon} {...iconProps} />
      )
    }

    return renderReleaseTypeIcon(release.metadata.releaseType, iconProps, size)
  }

  if (release && isDraftPerspective(release)) {
    return size === 'default' ? (
      <Icon icon={DotIcon} {...iconProps} />
    ) : (
      <Icon icon={RingIcon} {...iconProps} />
    )
  }

  return size === 'default' ? (
    <Icon icon={DotIcon} {...iconProps} />
  ) : (
    <Icon icon={CircleSmallIcon} {...iconProps} />
  )
}

export function ReleaseAvatar({
  padding = 3,
  ...iconProps
}: ReleaseAvatarIconProps & {
  padding?: Space
}): React.JSX.Element {
  // A flex container blockifies the glyph even when a v4 `Text` ancestor makes it inline (see
  // `ReleaseAvatar.css.ts`), so the padded box keeps the same size in both contexts.
  return (
    <Flex flexBasis="auto" flexGrow={0} flexShrink={0} padding={padding} style={{borderRadius: 3}}>
      <ReleaseAvatarIcon {...iconProps} />
    </Flex>
  )
}
