import {createVar, style, styleVariants} from '@vanilla-extract/css'

/** `font.code.family` */
export const codeFontFamilyVar = createVar()
/** `color.muted.default.enabled.bg` (v2: `color.button.ghost.default.enabled.bg`) */
export const codeBackgroundVar = createVar()

export const decoratorWrapper = style({
  display: 'inline',
})

export const decoration = styleVariants({
  'strong': {fontWeight: 'bold'},
  'em': {fontStyle: 'italic'},
  'underline': {textDecoration: 'underline'},
  'overline': {textDecoration: 'overline'},
  'strike-through': {textDecoration: 'line-through'},
  'code': {
    fontFamily: codeFontFamilyVar,
    background: codeBackgroundVar,
  },
})
