import {css} from '#styled-system/css'

const base = css.raw({
  /*
   * GlobalStyle pins every strong and b to the medium text weight so studio
   * chrome stays quiet. In the editor that leaves this decorator at 500
   * against body text at 400, which is hard to tell apart, especially in
   * dark mode. bolder is the user-agent step: 700 on regular text, and 900
   * on headings that are already 700, so a strong heading does not get lighter.
   */
  "&[data-mark='strong']": {
    fontWeight: 'bolder',
  },
})

/**
 * Keyed by the colour scheme (`color._dark`): the `mix-blend-mode` that keeps the annotation
 * styling visible through a `code` mark differs between dark (`screen`) and light (`multiply`).
 */
export const root = {
  dark: css(base, {
    "&[data-mark='code']": {
      color: 'inherit',
      mixBlendMode: 'screen',
    },
  }),
  light: css(base, {
    "&[data-mark='code']": {
      color: 'inherit',
      mixBlendMode: 'multiply',
    },
  }),
}
