import {createVar, style} from '@vanilla-extract/css'

/** `color.button.bleed[$tone].pressed.bg` / `.fg` from the theme, set by the `Segment` wrapper */
export const segmentBgVar = createVar()
export const segmentFgVar = createVar()

/** Marker class for every segment; the container styles select on it (`del${segment}`) */
export const segment = style({})

/** Applied when a `$tone` is given */
export const segmentToned = style({
  backgroundColor: segmentBgVar,
  color: segmentFgVar,
  textDecoration: 'none',
})
