import {style} from '@vanilla-extract/css'

export const rootFlex = style({
  'selectors': {
    // The ui5 Flex defaults `minHeight="0"` through `.sui-min-height` (0,1,0) in the static ui5
    // sheet; the styled() wrapper only won that tie by injection order, so add a second class.
    '&&': {
      minHeight: '100%',
    },
  },
  '@media': {
    // media[3] (POSITION_ABSOLUTE_MEDIA_INDEX)
    '(max-width: 1200px)': {
      position: 'relative',
    },
  },
})

export const sidebarMotionLayer = style({
  'display': 'flex',
  'flexDirection': 'column',
  'height': '100%',
  'width': '360px',
  'borderLeft': '1px solid var(--card-border-color)',
  'boxSizing': 'border-box',
  'overflow': 'hidden',
  'boxShadow':
    '0px 6px 8px -4px var(--card-shadow-umbra-color), 0px 12px 17px -1px var(--card-shadow-penumbra-color)',
  '@media': {
    // media[3] (POSITION_ABSOLUTE_MEDIA_INDEX)
    '(max-width: 1200px)': {
      bottom: 0,
      right: 0,
      top: 0,
      selectors: {
        // Layer sets `position: relative` on its root (0,1,0); the styled() wrapper only won that
        // tie by injection order, so add a second class.
        '&&': {
          position: 'absolute',
        },
      },
    },
    // media[1] (FULLSCREEN_MEDIA_INDEX)
    '(max-width: 600px)': {
      borderLeft: 0,
      minWidth: '100%',
      left: 0,
    },
  },
})
