// part:@sanity/base/undo-icon

import React from 'react'

const strokeStyle = {
  stroke: 'currentColor',
  strokeWidth: 1.2,
}

const UndoIcon = (): React.ReactElement => (
  <svg
    data-sanity-icon
    viewBox="0 0 25 25"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMidYMid"
    width="1em"
    height="1em"
  >
    <path
      d="M5 9L14.5 9C16.9853 9 19 11.0147 19 13.5V13.5C19 15.9853 16.9853 18 14.5 18L5 18"
      style={strokeStyle}
    />
    <path d="M9 13L5 9L9 5" style={strokeStyle} />
  </svg>
)

export default UndoIcon
