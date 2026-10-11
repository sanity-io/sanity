import {type BadgeTone} from '@sanity/ui'
import {clsx} from 'clsx'
import {type ComponentProps, type FC, type PropsWithChildren} from 'react'

import {type TargetPerspective} from '../../perspective/types'
import {LATEST} from '../util/const'
import {getReleaseTone} from '../util/getReleaseTone'
import {versionInlineBadge} from './VersionInlineBadge.css'

/**
 * @internal
 */
export function VersionInlineBadge(props: ComponentProps<'span'> & {$tone?: BadgeTone}) {
  const {$tone, className, ...rest} = props
  return <span {...rest} className={clsx(versionInlineBadge[$tone ?? 'default'], className)} />
}

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
