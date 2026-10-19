// Ported from the Storybook Variants 2.0 exploration (sanity-labs/sanity-studio-storybook, branch
// explorations/variants-2-0, commit 9748ea43e0, lib/explorations/variants-2-0/mark/StateBadge.tsx).
// Only the imports differ from the original (they point at this monorepo and ./types).
import {Button} from '../../../packages/sanity/src/ui-components/button/Button'

import {type ReactNode, useState} from 'react'
import {styled} from 'styled-components'

import {StateGlyph} from './StateGlyph'

/** The badge: a disc or ring of 8px, its centre 22px right and 4px down from the button's corner. */
const BADGE_HALO = 12
const BADGE_CENTRE = {x: 22, y: 4}

/**
 * The 25px icon button with the state dot as a badge on its top-right corner (SP4). The glyph is the
 * Studio's own disc or ring; a 12px halo under it takes the button's current fill (the card colour
 * at rest, the hover fill when the pointer is on the control), so it separates from the icon. The
 * badge ignores the pointer: the button is the one hit area.
 */
export function BadgedControl(props: {dot: 'published' | 'draft' | null; children: ReactNode}) {
  const [fill, setFill] = useState<string | undefined>(undefined)
  return (
    <span
      onPointerEnter={(event) => {
        const button = event.currentTarget.querySelector('button')
        if (button && !button.disabled) {
          requestAnimationFrame(() => setFill(getComputedStyle(button).backgroundColor))
        }
      }}
      onPointerLeave={() => setFill(undefined)}
      style={{position: 'relative', display: 'flex', lineHeight: 0}}
    >
      {props.children}
      {props.dot ? (
        <span
          aria-hidden
          data-state={props.dot}
          data-testid="state-badge"
          style={{
            position: 'absolute',
            left: BADGE_CENTRE.x - BADGE_HALO / 2,
            top: BADGE_CENTRE.y - BADGE_HALO / 2,
            width: BADGE_HALO,
            height: BADGE_HALO,
            borderRadius: '50%',
            background: fill ?? 'var(--card-bg-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          {/* The icon box is 25 units for a 7-unit disc: 28px of box gives an 8px dot. */}
          <span style={{display: 'flex', flex: 'none', fontSize: 28}}>
            <StateGlyph state={props.dot} />
          </span>
        </span>
      ) : null}
    </span>
  )
}

/** The SP4 button: the 25px icon button with a 1px border on hover (focus keeps the Button ring). */
export const BadgeButton = styled(Button)`
  cursor: pointer;
  &:disabled {
    cursor: default;
  }
  &:hover:not(:focus-visible):not(:disabled) {
    box-shadow: inset 0 0 0 1px var(--card-border-color);
  }
`

/**
 * The Option B control: the 25px button holding the state dot and nothing else. No fill and no
 * border on hover, so no box forms around the dot; the pointer, the popover and the focus ring (kept,
 * for the keyboard) are the affordance.
 */
export const DotButton = styled(Button)`
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  &:disabled {
    cursor: default;
  }
  background: transparent !important;
  &:not(:focus-visible) {
    box-shadow: none !important;
  }
`
