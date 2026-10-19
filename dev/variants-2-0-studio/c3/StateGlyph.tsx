// Ported from the Storybook Variants 2.0 exploration (sanity-labs/sanity-studio-storybook, branch
// explorations/variants-2-0, commit ef8bd9ec7f, lib/explorations/variants-2-0/mark/StateGlyph.tsx).
// Changes from the original: imports point at this monorepo and ./types; nothing else, except where marked "LIVE:".
import {CircleSmallIcon} from '../../../packages/sanity/src/core/components/temporary-icons/CircleSmall'
import {RingIcon} from '../../../packages/sanity/src/core/components/temporary-icons/Ring'

import {type CSSProperties} from 'react'

/**
 * The glyph of the state dot on its own: the green disc (published) or the amber ring (draft), the
 * Studio icons with the badge dot colours, the way `ReleaseAvatarIcon` colours its icons. It is an
 * icon, so it takes its size from the `Text` or `Button` that holds it.
 */
export function StateGlyph({
  state,
  gap = 0,
  size,
}: {
  state: 'published' | 'draft'
  gap?: number
  /** A pixel size for the icon box, when it is not inside a `Text` or `Button`. */
  size?: number
}) {
  const color =
    state === 'published'
      ? 'var(--card-badge-positive-dot-color)'
      : 'var(--card-badge-caution-dot-color)'
  // `color` as well, for a glyph that sits outside a Text or Button (a badge).
  const style = {
    '--card-icon-color': color,
    'color': color,
    'marginRight': gap,
    ...(size ? {width: size, height: size, flex: 'none', margin: 0} : {}),
  } as CSSProperties
  return state === 'published' ? <CircleSmallIcon style={style} /> : <RingIcon style={style} />
}
