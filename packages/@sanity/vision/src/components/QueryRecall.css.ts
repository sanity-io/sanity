import {css} from '#styled-system/css'

export const fixedHeader = css({
  flexShrink: 0,
  background: 'var(--card-bg-color)',
  zIndex: 1,
})

export const scrollContainer = css({
  minHeight: 0,
  width: '100%',
  minWidth: 0,
})

export const queryList = css({
  minHeight: 0,
})
