import {createVar, style} from '@vanilla-extract/css'

export const space2Var = createVar()
export const space5Var = createVar()

export const locationStack = style({
  display: 'flex',
  flexDirection: 'column',
  gap: space2Var,
  minHeight: '2.625rem', // rem(42)
  marginBottom: space5Var,
  selectors: {
    '&:empty': {
      display: 'none',
    },
  },
})
