import {createVar, style} from '@vanilla-extract/css'

export const formFieldAnchorPath = createVar()

export const formFieldAnchor = style({
  '@supports': {
    '(position-anchor: --anchor)': {
      position: 'absolute',
      positionAnchor: formFieldAnchorPath,
      insetBlockStart: 'anchor(center)',
      transform: 'translateY(-50%)',
      lineHeight: 0,
    },
  },
})
