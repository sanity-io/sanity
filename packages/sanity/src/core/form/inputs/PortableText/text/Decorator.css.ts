import {css} from '#styled-system/css'

/**
 * Keyed by the colour scheme (`color._dark`): the `mix-blend-mode` that keeps the annotation
 * styling visible through a `code` mark differs between dark (`screen`) and light (`multiply`).
 */
export const root = {
  dark: css({
    "&[data-mark='code']": {
      color: 'inherit',
      mixBlendMode: 'screen',
    },
  }),
  light: css({
    "&[data-mark='code']": {
      color: 'inherit',
      mixBlendMode: 'multiply',
    },
  }),
}
