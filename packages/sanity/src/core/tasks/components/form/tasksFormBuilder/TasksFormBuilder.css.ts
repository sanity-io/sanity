import {createVar, globalStyle, style} from '@vanilla-extract/css'

export const gridGapVar = createVar()

export const formBuilderRoot = style({})

globalStyle(`${formBuilderRoot} > [data-ui='Stack']`, {
  // Update spacing for the form builder
  gridGap: gridGapVar,
})
