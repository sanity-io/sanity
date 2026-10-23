import {css, firstThatWorks} from '#styled-system/css'

export const rootWrapper = css({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
})

export const contentWrapper = css({
  flex: '1 1 auto',
})

export const overlayWrapper = css({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  pointerEvents: 'none',
  zIndex: 13,
})

// Shared `RegionWrapper` mixin. `overflow: clip` was declared after `overflow: hidden` as a
// fallback chain, which `firstThatWorks()` reproduces.
const regionWrapper = css.raw({
  overflow: firstThatWorks('clip', 'hidden'),
  pointerEvents: 'none',
  position: 'absolute',
})

/** `${margins[0] - 1}px`; left unset (`top: auto`) when no `margins` are passed */
export const topVar = '--regions-with-intersections-top'

const topRegion = css.raw({
  ...regionWrapper,
  zIndex: 100,
  // the mixin's `position: absolute` stayed in the rule as a fallback for `sticky`
  position: firstThatWorks('sticky', 'absolute'),
  flex: 'none',
  height: '1px',
  top: `var(${topVar})`,
})

export const topRegionWrapper = {
  default: css(topRegion, {backgroundColor: 'transparent'}),
  debug: css(topRegion, {backgroundColor: 'red'}),
}

// the original also declared `visibility: none`, an invalid value browsers drop
export const middleRegionWrapper = {
  default: css(regionWrapper),
  debug: css(regionWrapper, {
    background: 'rgba(255, 0, 0, 0.25)',
    outline: '1px solid #00b',
    visibility: 'visible',
  }),
}

const bottomRegion = css.raw({
  ...regionWrapper,
  position: firstThatWorks('sticky', 'absolute'),
  flex: 'none',
  bottom: '-1px',
  height: '1px',
})

export const bottomRegionWrapper = {
  default: css(bottomRegion, {backgroundColor: 'transparent'}),
  debug: css(bottomRegion, {backgroundColor: 'blue'}),
}
