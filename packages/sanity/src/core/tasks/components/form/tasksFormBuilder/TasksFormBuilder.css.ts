import {css} from '#styled-system/css'

/** `rem(space[4])` */
export const stackGridGapVar = '--tasks-form-builder-stack-grid-gap'

// `grid-gap` (not `gap`) is what the original rule set; csstype marks it deprecated, so it is
// spread in from a const object instead of suppressing the lint (same as DetailPreview.css.ts).
const stackGridGap = {gridGap: `var(${stackGridGapVar})`} as const

export const formBuilderRoot = css({
  // Update spacing for the form builder
  "& > [data-ui='VStack']": {
    ...stackGridGap,
  },
})
