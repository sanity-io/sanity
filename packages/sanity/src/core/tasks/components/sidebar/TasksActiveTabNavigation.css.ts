import {css} from '#styled-system/css'

/** `color.input.default.enabled.border` */
export const inputBorderColorVar = '--tasks-active-tab-navigation-input-border-color'

export const divider = css({
  height: '25px',
  width: '1px',
  backgroundColor: `var(${inputBorderColorVar})`,
})
