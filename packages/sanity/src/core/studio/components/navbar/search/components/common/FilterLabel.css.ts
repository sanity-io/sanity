import {css} from '#styled-system/css'

export const flexShrinkVar = '--filter-label-flex-shrink'

export const filterLabelBox = css({
  flexShrink: `var(${flexShrinkVar})`,
})
