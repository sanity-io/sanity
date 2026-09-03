import {createVar, style} from '@vanilla-extract/css'

/** `${radius[3]}px` */
export const radius3Var = createVar()

export const variantSetHeader = style({
  backgroundColor: 'var(--card-muted-bg-color)',
  borderRadius: `${radius3Var} ${radius3Var} 0 0`,
})
