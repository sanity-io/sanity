import {css} from '#styled-system/css'

/* Using px value here to make title/subtitles align with icon */
export const subtitleText = css({
  // Text sets `margin: 0` on itself
  '&&': {
    marginTop: '2px',
  },
})

export const previewWrapper = css({
  height: '25px',
  width: '25px',
  overflow: 'hidden',
})
