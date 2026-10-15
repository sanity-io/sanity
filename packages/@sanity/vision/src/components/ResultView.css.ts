import {css} from '#styled-system/css'

// Custom properties `ResultViewWrapper` sets inline from the theme
export const codeFamilyVar = '--vision-code-family'
export const codeFontSizeVar = '--vision-code-font-size'
export const codeLineHeightVar = '--vision-code-line-height'
export const space0Var = '--vision-space-0'
export const space2Var = '--vision-space-2'
export const space4Var = '--vision-space-4'
export const space4HalfVar = '--vision-space-4-half'
export const syntaxPropertyVar = '--vision-syntax-property'
export const syntaxConstantVar = '--vision-syntax-constant'
export const syntaxStringVar = '--vision-syntax-string'
export const syntaxBooleanVar = '--vision-syntax-boolean'
export const syntaxNumberVar = '--vision-syntax-number'

export const resultViewWrapper = css({
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
    paddingTop: `var(${space0Var})`,
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
    content: '""',
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
    marginLeft: `calc(0px - var(${space4Var}))`,
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
    paddingTop: `var(${space2Var})`,
  },
  '& .json-inspector .json-inspector__value_string': {
    color: `var(${syntaxStringVar})`,
    wordBreak: 'break-word',
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
