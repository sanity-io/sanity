import {css} from '#styled-system/css'

export const columnarGrid = css({
  // Grid/Inline set align-items on themselves
  '&&': {
    alignItems: 'flex-start',
  },
})
