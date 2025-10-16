import {style} from '@vanilla-extract/css'
import {vars} from '@sanity/ui/css'

export const focusOverlayStyle = style({
  pointerEvents: 'none',
  position: 'absolute',
  zIndex: 2,
  borderRadius: vars.radius[1],
  // Note: offset is applied via inline style
})

export const pointerOverlayStyle = style({
  bottom: 0,
  display: 'none',
  left: 0,
  position: 'absolute',
  right: 0,
  top: 0,
  zIndex: 1,
  selectors: {
    '&[data-enabled="true"]': {
      '@media': {
        '(hover: hover)': {
          display: 'block',
        },
      },
    },
  },
})

export const virtualListBoxStyle = style({
  height: '100%',
  outline: 'none',
  overflowX: 'hidden',
  overflowY: 'auto',
  overscrollBehavior: 'contain',
  width: '100%',
})

export const virtualListChildBoxStyle = style({
  position: 'relative',
  width: '100%',
  // Note: height is applied via inline style
})
