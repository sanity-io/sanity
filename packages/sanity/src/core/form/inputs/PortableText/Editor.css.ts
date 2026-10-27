import {css} from '#styled-system/css'

/** `color.input.default.enabled.placeholder` */
export const placeholderColorVar = '--editor-placeholder-color'

export const placeholderWrapper = css({
  color: `var(${placeholderColorVar})`,
})
