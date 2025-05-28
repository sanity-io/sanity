import {css} from 'styled-components'

/**
 * A CSS helper that extends the clickable area of a component by adding a pseudo-element.
 * This creates a larger hit area for better usability without affecting the visual size.
 */
export const oversizedButtonStyle = css`
  position: relative;
  cursor: default;
  &::before {
    content: '';
    position: absolute;
    display: block;
    inset: -4px;
    border-radius: 9999px;
  }
`
