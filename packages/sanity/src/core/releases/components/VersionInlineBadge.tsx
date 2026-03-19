import {type BadgeTone} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {type FC, type PropsWithChildren} from 'react'

import {type TargetPerspective} from '../../perspective/types'
import {LATEST} from '../util/const'
import {getReleaseTone} from '../util/getReleaseTone'
import {bgColorVar, fgColorVar, styledVersionInlineBadge} from './VersionInlineBadge.css'

/**
 * @internal
 */
export const VersionInlineBadge = ({
  children,
  $tone,
}: PropsWithChildren<{
  $tone?: BadgeTone
}>) => (
  <span
    className={styledVersionInlineBadge}
    style={assignInlineVars({
      [fgColorVar]: `var(--card-badge-${$tone ?? 'default'}-fg-color)`,
      [bgColorVar]: `var(--card-badge-${$tone ?? 'default'}-bg-color)`,
    })}
  >
    {children}
  </span>
)

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
