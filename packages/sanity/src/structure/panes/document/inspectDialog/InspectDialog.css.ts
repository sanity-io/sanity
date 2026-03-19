import {createVar, globalStyle, style} from '@vanilla-extract/css'

export const codeFamilyVar = createVar()
export const codeFontSizeVar = createVar()
export const codeLineHeightVar = createVar()
export const space4Var = createVar()
export const space3Var = createVar()
export const syntaxPropertyVar = createVar()
export const syntaxConstantVar = createVar()
export const syntaxStringVar = createVar()
export const syntaxBooleanVar = createVar()
export const syntaxNumberVar = createVar()

export const jsonInspectorWrapper = style({})

globalStyle(`${jsonInspectorWrapper} .json-inspector, ${jsonInspectorWrapper} .json-inspector .json-inspector__selection`, {
  fontFamily: codeFamilyVar,
  fontSize: codeFontSizeVar,
  lineHeight: codeLineHeightVar,
  color: 'var(--card-code-fg-color)',
})

globalStyle(`${jsonInspectorWrapper} .json-inspector .json-inspector__leaf`, {
  paddingLeft: space4Var,
})

globalStyle(`${jsonInspectorWrapper} .json-inspector .json-inspector__leaf.json-inspector__leaf_root`, {
  paddingTop: space3Var,
  paddingLeft: 0,
})

globalStyle(`${jsonInspectorWrapper} .json-inspector > .json-inspector__leaf_root > .json-inspector__line > .json-inspector__key`, {
  display: 'none',
})

globalStyle(`${jsonInspectorWrapper} .json-inspector .json-inspector__line`, {
  display: 'block',
  position: 'relative',
  cursor: 'default',
})

globalStyle(`${jsonInspectorWrapper} .json-inspector .json-inspector__line::after`, {
  content: "''",
  position: 'absolute',
  top: 0,
  left: '-200px',
  right: '-50px',
  bottom: 0,
  zIndex: -1,
  pointerEvents: 'none',
})

globalStyle(`${jsonInspectorWrapper} .json-inspector .json-inspector__line:hover::after`, {
  background: 'var(--card-code-bg-color)',
})

globalStyle(`${jsonInspectorWrapper} .json-inspector .json-inspector__leaf_composite > .json-inspector__line`, {
  cursor: 'pointer',
})

globalStyle(`${jsonInspectorWrapper} .json-inspector .json-inspector__leaf_composite > .json-inspector__line::before`, {
  content: "'▸ '",
  marginLeft: `calc(0px - ${space4Var} + 3px)`,
  fontSize: codeFontSizeVar,
  lineHeight: codeLineHeightVar,
})

globalStyle(`${jsonInspectorWrapper} .json-inspector .json-inspector__leaf_expanded.json-inspector__leaf_composite > .json-inspector__line::before`, {
  content: "'▾ '",
  fontSize: codeFontSizeVar,
  lineHeight: codeLineHeightVar,
})

globalStyle(`${jsonInspectorWrapper} .json-inspector .json-inspector__radio, ${jsonInspectorWrapper} .json-inspector .json-inspector__flatpath`, {
  display: 'none',
})

globalStyle(`${jsonInspectorWrapper} .json-inspector .json-inspector__value`, {
  marginLeft: `calc(${space4Var} / 2)`,
})

globalStyle(`${jsonInspectorWrapper} .json-inspector > .json-inspector__leaf_root > .json-inspector__line > .json-inspector__key + .json-inspector__value`, {
  margin: '0',
})

globalStyle(`${jsonInspectorWrapper} .json-inspector .json-inspector__key`, {
  color: syntaxPropertyVar,
})

globalStyle(`${jsonInspectorWrapper} .json-inspector .json-inspector__value_helper, ${jsonInspectorWrapper} .json-inspector .json-inspector__value_null`, {
  color: syntaxConstantVar,
})

globalStyle(`${jsonInspectorWrapper} .json-inspector .json-inspector__not-found`, {
  paddingTop: space3Var,
})

globalStyle(`${jsonInspectorWrapper} .json-inspector .json-inspector__value_string`, {
  color: syntaxStringVar,
})

globalStyle(`${jsonInspectorWrapper} .json-inspector .json-inspector__value_boolean`, {
  color: syntaxBooleanVar,
})

globalStyle(`${jsonInspectorWrapper} .json-inspector .json-inspector__value_number`, {
  color: syntaxNumberVar,
})

globalStyle(`${jsonInspectorWrapper} .json-inspector .json-inspector__show-original`, {
  display: 'inline-block',
  padding: '0 6px',
  cursor: 'pointer',
})

globalStyle(`${jsonInspectorWrapper} .json-inspector .json-inspector__show-original:hover`, {
  color: 'inherit',
})

globalStyle(`${jsonInspectorWrapper} .json-inspector .json-inspector__show-original::before`, {
  content: "'↔'",
})

globalStyle(`${jsonInspectorWrapper} .json-inspector .json-inspector__show-original:hover::after`, {
  content: "' expand'",
})
