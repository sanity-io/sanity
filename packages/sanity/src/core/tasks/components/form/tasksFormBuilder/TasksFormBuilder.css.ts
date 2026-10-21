import {createVar, globalStyle, style} from '@vanilla-extract/css'

/** `rem(space[4])` */
export const stackGridGapVar = createVar()

export const formBuilderRoot = style({})

const stackGridGap = {gridGap: stackGridGapVar} as const

// Update spacing for the form builder
globalStyle(`${formBuilderRoot} > [data-ui='VStack']`, {
  ...stackGridGap,
})
