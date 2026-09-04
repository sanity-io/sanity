import {createVar, style} from '@vanilla-extract/css'

export const radius3Var = createVar()
export const space1Var = createVar()
export const space2Var = createVar()
export const space4Var = createVar()
/** `rgba(color.avatar.yellow.bg, 0.2)` (the legacy theme's `color.spot.yellow`) */
export const bgColorVar = createVar()

export const root = style({
  position: 'absolute',
  borderRadius: radius3Var,
  top: `calc(-1 * ${space2Var})`,
  bottom: `calc(-1 * (${space1Var} + ${space1Var}))`,
  left: space1Var,
  right: space1Var,
  backgroundColor: bgColorVar,
  pointerEvents: 'none',
})

export const rootFullScreen = style({
  left: `calc(${space4Var} + ${space1Var})`,
})
