import {createVar, style, styleVariants} from '@vanilla-extract/css'

export const codeFontFamilyVar = createVar()
export const codeBgVar = createVar()

const baseDecorator = style({
  display: 'inline',
})

export const decoratorVariants = styleVariants({
  strong: [baseDecorator, {fontWeight: 'bold'}],
  em: [baseDecorator, {fontStyle: 'italic'}],
  underline: [baseDecorator, {textDecoration: 'underline'}],
  overline: [baseDecorator, {textDecoration: 'overline'}],
  'strike-through': [baseDecorator, {textDecoration: 'line-through'}],
  code: [baseDecorator, {fontFamily: codeFontFamilyVar, background: codeBgVar}],
  default: [baseDecorator],
})
