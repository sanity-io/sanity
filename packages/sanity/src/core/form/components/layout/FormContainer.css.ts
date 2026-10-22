import {css} from '#styled-system/css'

import {formGutterCustomProperties} from './formGutterCustomProperties.css'

export const space4Var = '--form-container-space-4'
export const space5Var = '--form-container-space-5'
export const space9Var = '--form-container-space-9'
export const container1Var = '--form-container-1'

export const formContainerRoot = css(formGutterCustomProperties, {
  boxSizing: 'border-box',
  marginInline: 'auto',
  paddingInline: `var(${space4Var})`,
  paddingBlockStart: `var(${space5Var})`,
  paddingBlockEnd: `var(${space9Var})`,
  maxWidth: `calc(var(${container1Var}) + (var(--formGutterSize) * 2) + (var(--formGutterGap) * 2))`,
})
