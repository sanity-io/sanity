import {css} from '#styled-system/css'

export const releasesList = css({
  'maxWidth': '300px',
  'maxHeight': '200px',
  'overflowY': 'auto',
  '& > *': {
    flexShrink: 0,
  },
})
