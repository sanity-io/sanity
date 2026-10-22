import {css} from '#styled-system/css'

/** `font.code.family` */
export const codeFontFamilyVar = '--decorator-code-font-family'
/** `color.muted.default.enabled.bg` (v2: `color.button.ghost.default.enabled.bg`) */
export const codeBackgroundVar = '--decorator-code-background'

export const decoratorWrapper = css({
  display: 'inline',
})

export const decoration = {
  'strong': css({
    fontWeight: 'bold',
  }),
  'em': css({
    fontStyle: 'italic',
  }),
  'underline': css({
    textDecoration: 'underline',
  }),
  'overline': css({
    textDecoration: 'overline',
  }),
  'strike-through': css({
    textDecoration: 'line-through',
  }),
  'code': css({
    fontFamily: `var(${codeFontFamilyVar})`,
    background: `var(${codeBackgroundVar})`,
  }),
}
