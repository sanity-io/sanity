import {createVar, style} from '@vanilla-extract/css'

export const fieldChangeErrorVar = createVar()

export const fieldChangeContainer = style({
  vars: {
    [fieldChangeErrorVar]: 'inherit',
  },
  selectors: {
    '&[data-revert-all-changes-hover] [data-revert-all-hover]::before': {
      borderLeft: `2px solid ${fieldChangeErrorVar}`,
    },
  },
})

export const diffBorder = style({
  position: 'relative',
  selectors: {
    '&&': {
      paddingTop: 'var(--diff-inspect-padding-xsmall)',
      paddingBottom: 'var(--diff-inspect-padding-xsmall)',
      paddingLeft: 'var(--diff-inspect-padding-small)',
      paddingRight: 0,
    },
    '&::before': {
      content: "''",
      display: 'block',
      position: 'absolute',
      top: 0,
      left: 0,
      bottom: 0,
      borderLeft: '1px solid var(--card-border-color)',
    },
    '&[data-error]:hover::before': {
      borderLeft: `2px solid ${fieldChangeErrorVar}`,
    },
    '&[data-revert-field-hover]:hover::before': {
      borderLeft: `2px solid ${fieldChangeErrorVar}`,
    },
  },
})
