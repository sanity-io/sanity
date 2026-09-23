import {style} from '@vanilla-extract/css'

/* Using px value here to make title/subtitles align with icon */
export const subtitleText = style({
  selectors: {
    // Text sets `margin: 0` on itself
    '&&': {
      marginTop: '2px',
    },
  },
})

export const previewWrapper = style({
  height: '25px',
  width: '25px',
  overflow: 'hidden',
})
