import {style} from '@vanilla-extract/css'

export const ellipsisText = style({
  selectors: {
    '&&': {
      /* text-overflow: ellipsis;
          overflow: hidden;
          white-space: nowrap; */
      maxWidth: '120px',
    },
  },
})
