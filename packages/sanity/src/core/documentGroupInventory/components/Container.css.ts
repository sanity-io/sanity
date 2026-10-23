import {css} from '#styled-system/css'

export const container = css({
  display: 'grid',
  gridTemplateRows: 'min-content minmax(0, 1fr) min-content',
  blockSize: '100%',
  minBlockSize: 0,
})
