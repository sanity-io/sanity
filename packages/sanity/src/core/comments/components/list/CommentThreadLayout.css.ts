import {createVar, style} from '@vanilla-extract/css'

export const headerFlex = style({
  selectors: {
    '&&': {
      minHeight: '25px',
    },
  },
})

export const fgColorVar = createVar()

export const breadcrumbsButton = style({
  selectors: {
    '&&': {
      // The width is needed to make the text ellipsis work
      // in the breadcrumbs component
      maxWidth: '100%',
    },
  },
  vars: {
    '--card-fg-color': fgColorVar,
  },
})
