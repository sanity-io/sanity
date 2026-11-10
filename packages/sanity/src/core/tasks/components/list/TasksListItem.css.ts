import {css} from '#styled-system/css'

// Button only sets `width` when `width="fill"` is passed, which TitleButton does not.
export const titleButton = css({
  width: '100%',
  maxWidth: '100%',
})

export const taskDetailsRoot = css({
  /* Checkbox width is 17px and first row gap is 12px. */
  marginLeft: '29px',
})
