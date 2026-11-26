import {type BadgeTone} from '@sanity/ui'
import {clsx} from 'clsx'
import {
  type ComponentProps,
  type FC,
  type PointerEvent,
  type PropsWithChildren,
  type ReactNode,
  useRef,
  useState,
} from 'react'

import {type TargetPerspective} from '../../perspective/types'
import {LATEST} from '../util/const'
import {getReleaseTone} from '../util/getReleaseTone'
import {
  versionInlineBadge,
  versionInlineBadgeChip,
  versionInlineBadgeIcon,
  versionInlineBadgeName,
} from './VersionInlineBadge.css'

/**
 * An inline name chip in running text (a release, a perspective): a span in the version's tone.
 *
 * With an `icon` (a variant's diamond) or `truncate`, the chip is the variant banners' layout: the
 * glyph and the name in one box that wraps to the next line as a unit and never splits between
 * them. A name longer than the line truncates with an ellipsis; the full name stays in the DOM for
 * assistive technology, and shows as the chip's title while it is cut short.
 *
 * @internal
 */
export function VersionInlineBadge(
  props: ComponentProps<'span'> & {
    $tone?: BadgeTone
    /** The chip's glyph (a variant's diamond), drawn inside the chip. Implies `truncate`. */
    icon?: ReactNode
    /** Keep the chip on one line and truncate a long name, as the variant banners do. */
    truncate?: boolean
  },
) {
  const {$tone, className, icon, truncate, ...rest} = props
  if (!icon && !truncate) {
    return <span {...rest} className={clsx(versionInlineBadge[$tone ?? 'default'], className)} />
  }
  return <TruncatingInlineBadge {...rest} $tone={$tone} className={className} icon={icon} />
}

function TruncatingInlineBadge(
  props: ComponentProps<'span'> & {$tone?: BadgeTone; icon?: ReactNode},
) {
  const {$tone, className, icon, children, title, onPointerEnter, ...rest} = props
  const nameRef = useRef<HTMLSpanElement>(null)
  const [truncatedTitle, setTruncatedTitle] = useState<string | undefined>(undefined)

  // Measured when the pointer arrives, so a resize never leaves a stale title behind
  const handlePointerEnter = (event: PointerEvent<HTMLSpanElement>) => {
    const name = nameRef.current
    setTruncatedTitle(
      name && name.scrollWidth > name.clientWidth ? (name.textContent ?? undefined) : undefined,
    )
    onPointerEnter?.(event)
  }

  return (
    <span
      {...rest}
      data-inline-chip=""
      title={title ?? truncatedTitle}
      onPointerEnter={handlePointerEnter}
      className={clsx(versionInlineBadge[$tone ?? 'default'], versionInlineBadgeChip, className)}
    >
      {icon ? (
        <span className={versionInlineBadgeIcon} aria-hidden="true" data-inline-chip-icon="">
          {icon}
        </span>
      ) : null}
      <span ref={nameRef} className={versionInlineBadgeName} data-inline-chip-name="">
        {children}
      </span>
    </span>
  )
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
