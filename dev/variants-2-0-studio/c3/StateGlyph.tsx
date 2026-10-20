// Ported from the Storybook Variants 2.0 exploration (sanity-labs/sanity-studio-storybook, branch
// explorations/variants-2-0, commit 9748ea43e0, lib/explorations/variants-2-0/mark/StateGlyph.tsx).
// Only the imports differ from the original (they point at this monorepo and ./types).
import {CircleSmallIcon} from '../../../packages/sanity/src/core/components/temporary-icons/CircleSmall'
import {RingIcon} from '../../../packages/sanity/src/core/components/temporary-icons/Ring'

import {type CSSProperties} from 'react'

/**
 * The glyph of the state dot on its own: the green disc (published) or the amber ring (draft), the
 * Studio icons with the badge dot colours, the way `ReleaseAvatarIcon` colours its icons. It is an
 * icon, so it takes its size from the `Text` or `Button` that holds it.
 */
/** The states a dot can show. `release` is the suggest-tone disc; `absent` is a muted ring (no version here). */
export type StateKind = 'published' | 'draft' | 'release' | 'absent'

const COLOR: Record<StateKind, string> = {
  published: 'var(--card-badge-positive-dot-color)',
  draft: 'var(--card-badge-caution-dot-color)',
  release: 'var(--card-badge-suggest-dot-color)',
  absent: 'var(--card-muted-fg-color)',
}

export function StateGlyph({
  state,
  gap = 0,
  size,
}: {
  state: StateKind
  gap?: number
  /** A pixel size for the icon box, when it is not inside a `Text` or `Button`. */
  size?: number
}) {
  const color = COLOR[state]
  // `color` as well, for a glyph that sits outside a Text or Button (a badge).
  const style = {
    '--card-icon-color': color,
    'color': color,
    'marginRight': gap,
    ...(size ? {width: size, height: size, flex: 'none', margin: 0} : {}),
  } as CSSProperties
  return state === 'published' || state === 'release' ? <CircleSmallIcon style={style} /> : <RingIcon style={style} />
}

/** The disc fills about a quarter of the icon box, so a 32px box draws the 8px dot of the old hand-drawn one, centred in a 12px slot. */
const DOT_BOX = 32
const DOT_SLOT = 12

/** The dot of a row label: the real glyph at the 8px size of the old hand-drawn dot, centred in a fixed slot. */
export function StateDot({kind}: {kind: StateKind | 'none'}) {
  return (
    <span aria-hidden style={{alignItems: 'center', display: 'flex', flex: 'none', height: DOT_SLOT, justifyContent: 'center', width: DOT_SLOT}}>
      <StateGlyph size={DOT_BOX} state={kind === 'none' ? 'absent' : kind} />
    </span>
  )
}
