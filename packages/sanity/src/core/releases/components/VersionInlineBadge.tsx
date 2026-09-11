import {type BadgeTone} from '@sanity/ui'
import {type FC, type PropsWithChildren} from 'react'

import {type TargetPerspective} from '../../perspective/types'
import {LATEST} from '../util/const'
import {getReleaseTone} from '../util/getReleaseTone'
import {versionInlineBadge} from './VersionInlineBadge.css'

/**
 * @internal
 */
export const VersionInlineBadge = ({
  children,
  $tone,
}: PropsWithChildren<{
  $tone?: BadgeTone
}>) => <span className={versionInlineBadge[$tone ?? 'default']}>{children}</span>

/**
 * @internal
 */
export const getVersionInlineBadge = (release?: TargetPerspective) => {
  const tone = getReleaseTone(release ?? LATEST)

  const ReturnComponent: FC<PropsWithChildren> = ({children}) => (
    <VersionInlineBadge $tone={tone}>{children}</VersionInlineBadge>
  )

  return ReturnComponent
}
