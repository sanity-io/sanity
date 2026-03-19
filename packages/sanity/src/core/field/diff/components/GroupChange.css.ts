import {createVar, style} from '@vanilla-extract/css'

export const changeListWrapper = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr)',
})

export const groupChangeErrorVar = createVar()

export const groupChangeContainer = style({
  position: 'relative',
  selectors: {
    '&&': {
      paddingTop: 'var(--diff-inspect-padding-xsmall)',
      paddingBottom: 'var(--diff-inspect-padding-xsmall)',
      paddingLeft: 'var(--diff-inspect-padding-small)',
      paddingRight: 'var(--diff-inspect-padding-small)',
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
      borderLeft: `2px solid ${groupChangeErrorVar}`,
    },
    '&[data-revert-group-hover]:hover::before': {
      borderLeft: `2px solid ${groupChangeErrorVar}`,
    },
    '&[data-revert-all-groups-hover]::before': {
      borderLeft: `2px solid ${groupChangeErrorVar}`,
    },
  },
})
