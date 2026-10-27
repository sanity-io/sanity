import {css} from '#styled-system/css'

/** `color.button.bleed[$tone].pressed.bg` / `.fg` from the theme, set by the `Segment` wrapper */
export const segmentBgVar = '--segments-segment-bg'
export const segmentFgVar = '--segments-segment-fg'

/** Applied when a `$tone` is given */
export const segmentToned = css({
  backgroundColor: `var(${segmentBgVar})`,
  color: `var(${segmentFgVar})`,
  textDecoration: 'none',
})
