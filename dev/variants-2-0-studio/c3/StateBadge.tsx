import {DocumentsIcon} from '@sanity/icons/Documents'
import {Button as UIButton, Card, Text} from '@sanity/ui'
import {type CSSProperties, type ReactNode, useState} from 'react'
import {ReleaseAvatarIcon, useColorSchemeValue} from 'sanity'
import {styled} from 'styled-components'

// Ported from the Storybook Variants 2.0 exploration (sanity-labs/sanity-studio-storybook, branch
// explorations/variants-2-0, commit 9748ea43e0, lib/explorations/variants-2-0/mark/StateBadge.tsx).
// Only the imports differ from the original (they point at this monorepo and ./types).
import {Button} from '../../../packages/sanity/src/ui-components/button/Button'
import {Tooltip} from '../../../packages/sanity/src/ui-components/tooltip/Tooltip'
import {StateGlyph} from './StateGlyph'

// ---- Option A (v1): the versions icon button with the state dot as a badge on its corner. Kept as built, for the A/B pick.

/** The badge: a disc or ring of 8px, its centre 22px right and 4px down from the button's corner. */
const BADGE_HALO = 12
const BADGE_CENTRE = {x: 22, y: 4}

/**
 * The 25px icon button with the state dot as a badge on its top-right corner (SP4). The glyph is the
 * Studio's own disc or ring; a 12px halo under it takes the button's current fill (the card colour
 * at rest, the hover fill when the pointer is on the control), so it separates from the icon. The
 * badge ignores the pointer: the button is the one hit area.
 */
export function BadgedControl(props: {
  dot: 'published' | 'draft' | 'variant' | null
  children: ReactNode
}) {
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
          {/* The diamond fills more of its box than the disc does, so it gets a smaller box. */}
          <span
            style={{display: 'flex', flex: 'none', fontSize: props.dot === 'variant' ? 24 : 28}}
          >
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

// ---- Option B: the contained tile.

/**
 * T3 option B, the contained tile (Figma C3 "Option B · contained tile, only where there is more (spec, 22 Oct)", 674:3362): the versions
 * control is one tile with its own fill and a 1px hairline, so colour never touches the row fill. It is laid out from the right: the
 * versions icon keeps the tile's right edge, and the marks (the base or release dot, the variant diamond) sit in a padded column to its
 * left. With marks the tile is 51 × 29; with nothing to mark it holds just the icon (29 × 29). Either way the icons line up down the list.
 * The tile is the one control: a Studio Button in bleed mode, so its hover fill is the Studio's own, in its own Card, so a selected row does
 * not recolour it or its marks.
 */
const TILE = {height: 29, withMarks: 51, iconOnly: 29}
/** The row's status slot is top-aligned inside its 8px padding: the tile is moved 8px from the row's right edge, centred on its 49px. */
const TILE_OFFSET = {x: 4, y: 2}
/** The versions icon's 25px box, 2px inside the tile's right and top edges. */
const ICON_INSET = 2
/** The marks' column: 16px slots whose centres sit 13px in from the tile's left edge; two marks at 1 and 13, one centred; each glyph's 25px
 * box centred in its slot. */
const MARK = {slot: 16, left: 5, top: [1, 13], centred: 6.5, glyph: 25}

/** The hairline: the foreground at 14% (light) or 18% (dark); stronger on hover. */
const HAIRLINE = {
  light: {rest: 'rgba(0, 0, 0, 0.14)', hover: 'rgba(0, 0, 0, 0.28)'},
  dark: {rest: 'rgba(255, 255, 255, 0.18)', hover: 'rgba(255, 255, 255, 0.36)'},
}

export const TILE_TOOLTIP = 'Versions · opens the inventory'

const TileButton = styled(UIButton)`
  cursor: pointer;
  position: relative;
  height: ${TILE.height}px;
  padding: 0;
  border-radius: 4px;
  overflow: visible;
  &:not(:hover) {
    background-color: var(--card-bg-color);
  }
  box-shadow: inset 0 0 0 1px var(--tile-hairline) !important;
  &:hover:not(:disabled) {
    box-shadow: inset 0 0 0 1px var(--tile-hairline-hover) !important;
  }
  /* The Studio's focus ring, 2px, outside the tile (radius 6). */
  &:focus-visible {
    outline: 2px solid var(--card-focus-ring-color);
    outline-offset: 0;
  }
  &:disabled {
    cursor: default;
  }
  & > span {
    display: block;
    position: absolute;
    inset: 0;
  }
`

/** A mark in the tile: the base document's state, the release a release-only document is in, or the variant diamond. */
export type TileMark = 'published' | 'draft' | 'asap' | 'scheduled' | 'undecided' | 'variant'

function MarkGlyph({kind}: {kind: TileMark}) {
  if (kind === 'asap' || kind === 'scheduled' || kind === 'undecided') {
    // The release's own status glyph, as the Studio draws it for that release type.
    return (
      <span style={{display: 'flex', fontSize: MARK.glyph, lineHeight: 0}}>
        <ReleaseAvatarIcon releaseType={kind} />
      </span>
    )
  }
  return <StateGlyph size={MARK.glyph} state={kind} />
}

/**
 * A document with nothing more than its base version: its state dot alone, no tile and no button, as the stock Studio shows it. The dot is
 * centred where the tile's icon sits, so it keeps the icon column (Figma: a 16px slot at x 329.5, y 16.5 in the 360 × 49 row).
 */
export function BaseDotOnly({state}: {state: 'published' | 'draft'}) {
  return (
    <span
      aria-label={`The base document is ${state}`}
      data-testid="version-dot-only"
      role="img"
      style={{
        position: 'relative',
        left: TILE_OFFSET.x,
        // As a block box the slot starts 2px lower than the tile's inline box, so it needs no vertical offset to centre on the row (measured).
        top: 0,
        width: TILE.iconOnly,
        height: TILE.height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <span
        style={{
          width: MARK.slot,
          height: MARK.slot,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <StateGlyph size={MARK.glyph} state={state} />
      </span>
    </span>
  )
}

export function TileControl(props: {
  marks: readonly TileMark[]
  testId: string
  label: string
  describedBy?: string
  disabled?: boolean
  onClick: (event?: {preventDefault?: () => void; stopPropagation?: () => void}) => void
}) {
  const scheme = useColorSchemeValue() === 'dark' ? 'dark' : 'light'
  const {marks} = props
  const width = marks.length ? TILE.withMarks : TILE.iconOnly
  return (
    // Its own Card in the default tone: a selected row's tone does not reach the tile's fill or its marks.
    <Card
      as="span"
      data-testid="version-tile"
      style={{
        display: 'inline-flex',
        justifyContent: 'flex-end',
        background: 'none',
        position: 'relative',
        left: TILE_OFFSET.x,
        top: TILE_OFFSET.y,
      }}
      tone="default"
    >
      <Tooltip content={TILE_TOOLTIP}>
        <TileButton
          aria-describedby={props.describedBy}
          aria-label={props.label}
          data-marks={marks.join(' ') || 'none'}
          data-testid={props.testId}
          disabled={props.disabled}
          mode="bleed"
          onClick={props.onClick}
          style={
            {
              'width': width,
              'minWidth': width,
              '--tile-hairline': HAIRLINE[scheme].rest,
              '--tile-hairline-hover': HAIRLINE[scheme].hover,
            } as CSSProperties
          }
        >
          <span
            aria-hidden
            data-tile-icon=""
            style={{
              position: 'absolute',
              right: ICON_INSET,
              top: ICON_INSET,
              width: 25,
              height: 25,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text size={1}>
              <DocumentsIcon />
            </Text>
          </span>
          {marks.map((kind, index) => (
            <span
              aria-hidden
              data-tile-mark={kind}
              key={kind}
              style={{
                position: 'absolute',
                left: MARK.left,
                top: marks.length === 1 ? MARK.centred : MARK.top[index],
                width: MARK.slot,
                height: MARK.slot,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'visible',
              }}
            >
              <MarkGlyph kind={kind} />
            </span>
          ))}
        </TileButton>
      </Tooltip>
    </Card>
  )
}

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
