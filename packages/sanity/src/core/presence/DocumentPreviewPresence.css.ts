import {createVar, style} from '@vanilla-extract/css'

/** `${space[1]}px` */
export const space1Var = createVar()

export const avatarStackBox = style({
  margin: `calc(-1 * ${space1Var})`,
})
