import {style} from '@vanilla-extract/css'

// Note: media breakpoints are hardcoded since they come from the styled-components theme
// and are standard sanity/ui breakpoints
const POSITION_ABSOLUTE_BREAKPOINT = '1024px'
const FULLSCREEN_BREAKPOINT = '600px'

export const rootFlex = style({
  selectors: {
    '&&': {
      minHeight: '100%',
    },
  },
  '@media': {
    [`(max-width: ${POSITION_ABSOLUTE_BREAKPOINT})`]: {
      position: 'relative',
    },
  },
})

export const sidebarMotionLayer = style({
  selectors: {
    '&&': {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      width: '360px',
      borderLeft: '1px solid var(--card-border-color)',
      boxSizing: 'border-box',
      overflow: 'hidden',
      boxShadow: '0px 6px 8px -4px var(--card-shadow-umbra-color), 0px 12px 17px -1px var(--card-shadow-penumbra-color)',
    },
  },
  '@media': {
    [`(max-width: ${POSITION_ABSOLUTE_BREAKPOINT})`]: {
      bottom: 0,
      position: 'absolute',
      right: 0,
      top: 0,
    },
    [`(max-width: ${FULLSCREEN_BREAKPOINT})`]: {
      borderLeft: 0,
      minWidth: '100%',
      left: 0,
    },
  },
})
