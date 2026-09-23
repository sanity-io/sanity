import {css, styled} from 'styled-components'

import {WithIntersection} from './WithIntersection'

interface StyleProps {
  $debug: boolean
  $margins?: [number, number, number, number]
}

/**
 * The in-flow children are the top sentinel, the content wrapper and the bottom sentinel. Laying
 * them out as a flex column lets the content wrapper fill the root when the root is given a
 * definite height (e.g. inside the fullscreen Portable Text editor), so `height: 100%` chains
 * through it. With an auto height root this is equivalent to normal block flow. A flex column
 * rather than a grid: a grid item's containing block is its grid area, which would pin the sticky
 * sentinels to their own 1px rows, while a flex item's is the whole container.
 */
export const RootWrapper = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
`

/** Wraps the overlay's children; grows to fill the root, never shrinks below its content */
export const ContentWrapper = styled.div`
  flex: 1 1 auto;
`

export const OverlayWrapper = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 13;
`

const RegionWrapper = css`
  overflow: hidden;
  overflow: clip;
  pointer-events: none;
  position: absolute;
`

export const TopRegionWrapper = styled(WithIntersection)<StyleProps>(({$debug, $margins}) => {
  return css`
    ${RegionWrapper}

    z-index: 100;
    position: sticky;
    flex: none;
    height: 1px;
    top: ${$margins ? `${$margins[0] - 1}px` : 'auto'};
    background-color: ${$debug ? 'red' : 'transparent'};
  `
})

export const MiddleRegionWrapper = styled(WithIntersection)<StyleProps>(({$debug}) => {
  return css`
    ${RegionWrapper}

    visibility: none;

    ${
      $debug &&
      css`
        background: rgba(255, 0, 0, 0.25);
        outline: 1px solid #00b;
        visibility: visible;
      `
    }
  `
})

export const BottomRegionWrapper = styled(WithIntersection)<StyleProps>(({$debug}) => {
  return css`
    ${RegionWrapper}

    position: sticky;
    flex: none;
    bottom: -1px;
    height: 1px;
    background-color: ${$debug ? 'blue' : 'transparent'};
  `
})
