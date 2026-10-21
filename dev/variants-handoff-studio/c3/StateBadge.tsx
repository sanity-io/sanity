import {DocumentsIcon} from '@sanity/icons/Documents'
import {Button as UIButton, Card, Text} from '@sanity/ui'
import {type CSSProperties} from 'react'
import {ReleaseAvatarIcon, useColorSchemeValue} from 'sanity'
import {styled} from 'styled-components'

// Ported from the Storybook Variants 2.0 exploration (sanity-labs/sanity-studio-storybook, branch
// explorations/variants-2-0, commit 9748ea43e0, lib/explorations/variants-2-0/mark/StateBadge.tsx).
// Only the imports differ from the original (they point at this monorepo and ./types).
import {Button} from '../../../packages/sanity/src/ui-components/button/Button'
import {Tooltip} from '../../../packages/sanity/src/ui-components/tooltip/Tooltip'
import {StateGlyph} from './StateGlyph'

/**
 * C3 option D, the contained tile (Figma C3 "D contained tile · full spec", 22 Oct): the versions control is one tile with its own fill and
 * a 1px hairline, so colour never touches the row fill. It is laid out from the right: the versions icon keeps the tile's right edge, and the
 * marks (the base or release dot, the variant diamond) sit in a column to its left. With marks the tile is 43 × 29; with nothing to mark it
 * holds just the icon (29 × 29). Either way the icons line up down the list. The tile is the one control: a Studio Button in bleed mode, so
 * its hover fill is the Studio's own, in its own Card, so a selected row does not recolour it or its marks.
 */
const TILE = {height: 29, withMarks: 43, iconOnly: 29}
/** The row's status slot is top-aligned inside its 8px padding: the tile is moved 8px from the row's right edge, centred on its 49px. */
const TILE_OFFSET = {x: 4, y: 2}
/** The versions icon's 25px box, 2px inside the tile's right and top edges. */
const ICON_INSET = 2
/** The marks' column: 16px slots, 1px from the tile's left edge; two marks at 1 and 13, one centred; each glyph's 25px box centred in it. */
const MARK = {slot: 16, left: 1, top: [1, 13], centred: 6.5, glyph: 25}

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
