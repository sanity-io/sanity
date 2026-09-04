import {createVar, style} from '@vanilla-extract/css'

import {formGutterCustomProperties} from './formGutterCustomProperties.css'

export const space4Var = createVar()
export const space5Var = createVar()
export const space9Var = createVar()
export const container1Var = createVar()

export const formContainerRoot = style([
  formGutterCustomProperties,
  {
    boxSizing: 'border-box',
    marginInline: 'auto',
    paddingInline: space4Var,
    paddingBlockStart: space5Var,
    paddingBlockEnd: space9Var,
    maxWidth: `calc(${container1Var} + (var(--formGutterSize) * 2) + (var(--formGutterGap) * 2))`,
  },
])
