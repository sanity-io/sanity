import {createVar, globalStyle, style} from '@vanilla-extract/css'

/** `focusRingStyle(...)` output, computed from the theme in the `FileButton` wrapper */
export const fileButtonFocusRingBoxShadowVar = createVar()

export const fileButton = style({
  selectors: {
    "&:not([data-disabled='true']):focus-within": {
      boxShadow: fileButtonFocusRingBoxShadowVar,
    },
  },
})

// The underlying file input is rendered as children within a Sanity UI <Button> component.
// The below visibly hides it by targeting the input's parent <span> element, which is
// added by the <Button> component.
// TODO: refactor, avoid nth-child selector usage
globalStyle(`${fileButton} > span:nth-child(2)`, {
  overflow: ['hidden', 'clip'],
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
