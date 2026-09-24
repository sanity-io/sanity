import {css} from '#styled-system/css'

export const buttonContainer = css({
  'position': 'relative',
  "& [data-ui='Badge']": {
    position: 'absolute',
    top: '-2px',
    right: '-2px',
  },
})
