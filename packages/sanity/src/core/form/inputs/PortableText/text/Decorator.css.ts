import {styleVariants} from '@vanilla-extract/css'

const codeMark = `&[data-mark='code']`

/**
 * Keyed by the colour scheme (`color._dark`): the `mix-blend-mode` that keeps the annotation
 * styling visible through a `code` mark differs between dark (`screen`) and light (`multiply`).
 */
export const root = styleVariants({
  dark: {
    selectors: {
      [codeMark]: {
        color: 'inherit',
        mixBlendMode: 'screen',
      },
    },
  },
  light: {
    selectors: {
      [codeMark]: {
        color: 'inherit',
        mixBlendMode: 'multiply',
      },
    },
  },
})
