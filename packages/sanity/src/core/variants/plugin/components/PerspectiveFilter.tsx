import {RemoveIcon} from '@sanity/icons/Remove'
import {Box, Card, Flex, Text, type CardTone} from '@sanity/ui'
import {type ReactNode} from 'react'
import {styled} from 'styled-components'

import {Button} from '../../../../ui-components/button/Button'
import {AnimatedTextWidth} from '../../../perspective/navbar/AnimatedTextWidth'

/**
 * The pill holding a filter's control(s). Mirrors `PerspectiveFilter.Button` +
 * `PerspectiveFilter.Remove` in the Studio Patterns file: a single 25px-tall
 * rounded rect, optionally split by a hairline into a main target and a remove
 * target.
 */
const FilterPill = styled(Card)`
  display: flex;
  /* Card ships its own display rule, so a bare \`display: flex\` loses to it and
     the segments stack vertically. Same guard the other nav containers use. */
  &:not([hidden]) {
    display: flex;
  }
  align-items: center;
  overflow: hidden;
  position: relative;

  /* The outline is an overlay rather than a border so it does not add to the
     pill's height (Figma's 25px includes it) and, critically, so it paints over
     the segments — a segment's hover/pressed background is opaque and would
     otherwise cover an inset shadow, leaving those states borderless. Figma
     models this the same way, as an absolutely positioned inset-0 layer. */
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    box-shadow: inset 0 0 0 1px var(--card-border-color);
    pointer-events: none;
    z-index: 1;
  }

  /* Segments sit flush against the pill's edges, so they must not paint a
     resting background: a bleed button renders the base card background, which
     reads as light caps at each end once the pill is toned. Hover/focus still
     paint, so the segments keep their affordance. Matched at any depth because
     a button with a tooltip is wrapped in a span. */
  && button:not(:hover):not(:focus-visible),
  && a:not(:hover):not(:focus-visible) {
    background-color: transparent;
  }
`

/** The hairline between the main target and the remove target. */
const SegmentDivider = styled.div`
  width: 1px;
  align-self: stretch;
  background-color: var(--card-border-color);
`

interface PerspectiveFilterProps {
  /** Static label rendered before the pill, e.g. "Version" or "Variant". */
  prefix: string
  tone: CardTone
  /** The filter's main control — a single button that opens the filter's menu. */
  children: ReactNode
  /** When set, the pill gains a remove segment that clears just this filter. */
  onRemove?: () => void
  removeLabel?: string
  /**
   * The control's current label. Because the label lives inside the pill, a
   * selection change resizes the pill, which yanks the anchored menu to a new
   * position. Passing the label here animates that width change instead of
   * snapping it.
   */
  animateOn?: string
}

/**
 * One labelled filter in the perspective bar: a static prefix followed by a
 * pill. The prefix sits flush against the pill, matching the design.
 *
 * @internal
 */
export function PerspectiveFilter({
  prefix,
  tone,
  children,
  onRemove,
  removeLabel,
  animateOn,
}: PerspectiveFilterProps): React.JSX.Element {
  return (
    <Flex align="center" data-ui="PerspectiveFilter">
      <Box paddingX={2}>
        <Text size={1}>{prefix}</Text>
      </Box>
      <FilterPill tone={tone} radius={2}>
        {animateOn === undefined ? (
          children
        ) : (
          <AnimatedTextWidth text={animateOn}>{children}</AnimatedTextWidth>
        )}
        {onRemove && (
          <>
            <SegmentDivider />
            <Button
              data-testid="perspective-filter-remove"
              icon={RemoveIcon}
              mode="bleed"
              onClick={onRemove}
              tooltipProps={removeLabel ? {content: removeLabel} : null}
            />
          </>
        )}
      </FilterPill>
    </Flex>
  )
}
