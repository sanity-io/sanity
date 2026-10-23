import {css} from '#styled-system/css'

export const optionObserveElement = css({
  listStyle: 'none',
  whiteSpace: 'nowrap',
  flexShrink: 0,
  opacity: 0,
  visibility: 'hidden',
})

export const hiddenRow = css({
  opacity: 0,
  height: '0.1px',
  overflow: 'hidden',
})

export const menuButtonPlaceholder = css({
  display: 'flex',
  visibility: 'hidden',
})
