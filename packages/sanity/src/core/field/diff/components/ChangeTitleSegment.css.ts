import {createVar, style} from '@vanilla-extract/css'

export const radiusVar = createVar()
export const paddingVar = createVar()

export const roundedCard = style({
  borderRadius: radiusVar,
  padding: paddingVar,
})

export const annotationText = style({
  selectors: {
    '&&:not([hidden])': {
      color: 'inherit',
    },
  },
})
