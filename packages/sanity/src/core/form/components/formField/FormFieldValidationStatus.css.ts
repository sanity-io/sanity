import {style} from '@vanilla-extract/css'

export const statusIconWrapper = style({
  left: '8px',
  position: 'relative',
  width: '25px',
})

export const statusIconButton = style([
  statusIconWrapper,
  {
    alignItems: 'center',
    appearance: 'none',
    background: 'transparent',
    border: 0,
    color: 'inherit',
    cursor: 'pointer',
    display: 'flex',
    font: 'inherit',
    justifyContent: 'center',
    margin: 0,
    padding: 0,
  },
])

export const styledStack = style({
  maxWidth: '200px',
})
