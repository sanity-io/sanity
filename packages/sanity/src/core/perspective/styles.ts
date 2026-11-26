import {css} from 'styled-components'

/**
 * Extends the clickable area of a control with a pseudo-element.
 * The hit area grows without changing the visual size.
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
