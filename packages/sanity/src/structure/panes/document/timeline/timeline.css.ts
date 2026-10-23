import {css} from '#styled-system/css'

export const stackWrapper = css({
  maxWidth: '200px',
})

export const listWrapperMaxHeightVar = '--timeline-list-wrapper-max-height'

export const listWrapper = css({
  'maxHeight': `var(${listWrapperMaxHeightVar})`,
  // `&&` beats the ui5 Flex's own `min-width: 0`, which the styled() rule only beat by injection
  // order
  '&&': {
    minWidth: '244px',
  },
})

export const root = css({
  opacity: 0,
  pointerEvents: 'none',
  transition: 'opacity 0.2s',
})

// Follows `root` on the same element; `&&` keeps its `opacity` / `pointer-events` winning.
export const rootVisible = css({
  '&&': {
    opacity: 1,
    pointerEvents: 'auto',
  },
})
