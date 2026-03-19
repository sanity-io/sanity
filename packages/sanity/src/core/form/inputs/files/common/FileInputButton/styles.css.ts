import {createVar, globalStyle, style} from '@vanilla-extract/css'

export const focusRingShadowVar = createVar()

const sharedControl = style({
  selectors: {
    '&&:not([data-disabled="true"]):focus-within': {
      boxShadow: focusRingShadowVar,
    },
  },
})

globalStyle(`${sharedControl} > span:nth-child(2)`, {
  overflow: 'clip',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  position: 'absolute',
  minWidth: 0,
  display: 'block',
  appearance: 'none',
  padding: 0,
  margin: 0,
  border: 0,
  opacity: 0,
})

export const fileButton = style([sharedControl])
export const fileMenuItem = style([sharedControl])
