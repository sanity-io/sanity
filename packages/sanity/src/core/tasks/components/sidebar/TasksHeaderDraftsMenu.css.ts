import {style} from '@vanilla-extract/css'

// Menu's root is `styled(Box)` with only `outline`/`overflow`, so a plain class carries `width`.
export const styledMenu = style({
  width: '220px',
})
