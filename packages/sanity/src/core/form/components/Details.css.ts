import {css} from '#styled-system/css'
import {type SystemStyleObject} from '#styled-system/types'

// `-webkit-font-smoothing` is not among the properties Panda types
const fontSmoothingInherit = {WebkitFontSmoothing: 'inherit'} as SystemStyleObject

export const headerButton = css(fontSmoothingInherit, {
  display: 'block',
  appearance: 'none',
  font: 'inherit',
  background: 'none',
  width: '100%',
  textAlign: 'left',
  border: 0,
  margin: 0,
  padding: 0,
  outline: 'none',
})

export const toggleArrowOpen = css({
  transform: 'rotate(90deg)',
})

export const header = css({
  cursor: 'default',
  lineHeight: 0,
})

export const iconBox = css({
  '& > div > svg': {
    transform: 'rotate(0)',
    transition: 'transform 100ms',
  },
  '&[data-open] > div > svg': {
    transform: 'rotate(90deg)',
  },
})
