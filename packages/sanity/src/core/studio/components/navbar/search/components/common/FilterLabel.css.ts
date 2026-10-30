import {css} from '#styled-system/css'

/** Set inline by `FilterLabel`'s `CustomBox` from its `$flexShrink` prop */
export const flexShrinkVar = '--filter-label-flex-shrink'

export const filterLabelBox = css({
  flexShrink: `var(${flexShrinkVar})`,
})
