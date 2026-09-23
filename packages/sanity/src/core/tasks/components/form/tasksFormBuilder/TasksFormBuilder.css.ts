import {createVar, globalStyle, style} from '@vanilla-extract/css'

/** `rem(space[4])` */
export const stackGridGapVar = createVar()

export const formBuilderRoot = style({})

// `grid-gap` (not `gap`) is what the original rule set; csstype marks it deprecated, so it is
// spread in from a const object instead of suppressing the lint (same as DetailPreview.css.ts).
const stackGridGap = {gridGap: stackGridGapVar} as const

// Update spacing for the form builder
globalStyle(`${formBuilderRoot} > [data-ui='Stack']`, {
  ...stackGridGap,
})
