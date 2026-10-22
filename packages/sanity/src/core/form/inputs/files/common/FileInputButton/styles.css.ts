import {css, firstThatWorks} from '#styled-system/css'

/** `focusRingStyle(...)` output, computed from the theme in the `FileButton` wrapper */
export const fileButtonFocusRingBoxShadowVar =
  '--file-input-button-file-button-focus-ring-box-shadow'

export const fileButton = css({
  // `&&`: Button's own hover and pressed `box-shadow` rules have the same specificity otherwise
  "&&:not([data-disabled='true']):focus-within": {
    boxShadow: `var(${fileButtonFocusRingBoxShadowVar})`,
  },
  // The underlying file input is rendered as children within a Sanity UI <Button> component.
  // The below visibly hides it by targeting the input's parent <span> element, which is
  // added by the <Button> component.
  // TODO: refactor, avoid nth-child selector usage
  '& > span:nth-child(2)': {
    overflow: firstThatWorks('clip', 'hidden'),
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
  },
})
