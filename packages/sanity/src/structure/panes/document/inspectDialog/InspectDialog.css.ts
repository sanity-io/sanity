import {css} from '#styled-system/css'

export const codeFamilyVar = '--inspect-dialog-code-family'
export const codeFontSizeVar = '--inspect-dialog-code-font-size'
export const codeLineHeightVar = '--inspect-dialog-code-line-height'
export const space3Var = '--inspect-dialog-space-3'
export const space4Var = '--inspect-dialog-space-4'
export const space4HalfVar = '--inspect-dialog-space-4-half'
export const syntaxPropertyVar = '--inspect-dialog-syntax-property'
export const syntaxConstantVar = '--inspect-dialog-syntax-constant'
export const syntaxStringVar = '--inspect-dialog-syntax-string'
export const syntaxBooleanVar = '--inspect-dialog-syntax-boolean'
export const syntaxNumberVar = '--inspect-dialog-syntax-number'

export const jsonInspectorWrapper = css({
  '& .json-inspector, & .json-inspector .json-inspector__selection': {
    fontFamily: `var(${codeFamilyVar})`,
    fontSize: `var(${codeFontSizeVar})`,
    lineHeight: `var(${codeLineHeightVar})`,
    color: 'var(--card-code-fg-color)',
  },
  '& .json-inspector .json-inspector__leaf': {
    paddingLeft: `var(${space4Var})`,
  },
  '& .json-inspector .json-inspector__leaf.json-inspector__leaf_root': {
    paddingTop: `var(${space3Var})`,
    paddingLeft: 0,
  },
  '& .json-inspector > .json-inspector__leaf_root > .json-inspector__line > .json-inspector__key': {
    display: 'none',
  },
  '& .json-inspector .json-inspector__line': {
    display: 'block',
    position: 'relative',
    cursor: 'default',
  },
  '& .json-inspector .json-inspector__line::after': {
    content: "''",
    position: 'absolute',
    top: 0,
    left: '-200px',
    right: '-50px',
    bottom: 0,
    zIndex: -1,
    pointerEvents: 'none',
  },
  '& .json-inspector .json-inspector__line:hover::after': {
    background: 'var(--card-code-bg-color)',
  },
  '& .json-inspector .json-inspector__leaf_composite > .json-inspector__line': {
    cursor: 'pointer',
  },
  '& .json-inspector .json-inspector__leaf_composite > .json-inspector__line::before': {
    content: "'▸ '",
    // Copied verbatim from the styled-components template (unitless `0` minus a length).
    marginLeft: `calc(0 - var(${space4Var}) + 3px)`,
    fontSize: `var(${codeFontSizeVar})`,
    lineHeight: `var(${codeLineHeightVar})`,
  },
  '& .json-inspector .json-inspector__leaf_expanded.json-inspector__leaf_composite > .json-inspector__line::before':
    {
      content: "'▾ '",
      fontSize: `var(${codeFontSizeVar})`,
      lineHeight: `var(${codeLineHeightVar})`,
    },
  '& .json-inspector .json-inspector__radio, & .json-inspector .json-inspector__flatpath': {
    display: 'none',
  },
  '& .json-inspector .json-inspector__value': {
    marginLeft: `var(${space4HalfVar})`,
  },
  '& .json-inspector > .json-inspector__leaf_root > .json-inspector__line > .json-inspector__key + .json-inspector__value':
    {
      margin: 0,
    },
  '& .json-inspector .json-inspector__key': {
    color: `var(${syntaxPropertyVar})`,
  },
  '& .json-inspector .json-inspector__value_helper, & .json-inspector .json-inspector__value_null':
    {
      color: `var(${syntaxConstantVar})`,
    },
  '& .json-inspector .json-inspector__not-found': {
    paddingTop: `var(${space3Var})`,
  },
  '& .json-inspector .json-inspector__value_string': {
    color: `var(${syntaxStringVar})`,
  },
  '& .json-inspector .json-inspector__value_boolean': {
    color: `var(${syntaxBooleanVar})`,
  },
  '& .json-inspector .json-inspector__value_number': {
    color: `var(${syntaxNumberVar})`,
  },
  '& .json-inspector .json-inspector__show-original': {
    display: 'inline-block',
    padding: '0 6px',
    cursor: 'pointer',
  },
  '& .json-inspector .json-inspector__show-original:hover': {
    color: 'inherit',
  },
  '& .json-inspector .json-inspector__show-original::before': {
    content: "'↔'",
  },
  '& .json-inspector .json-inspector__show-original:hover::after': {
    content: "' expand'",
  },
})
