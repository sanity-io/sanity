// exported by Question.js

import React from 'react'

const strokeStyle = {
  stroke: 'currentColor',
  strokeWidth: 1.2
}

const HelpCircleIcon = () => (
  <svg
    data-sanity-icon
    viewBox="0 0 25 25"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMidYMid"
    width="1em"
    height="1em"
  >
    <circle cx="12.5" cy="12.5" r="8" style={strokeStyle} />
    <path d="M12.5 16V14.5" style={strokeStyle} />
    <path
      d="M12.5 13C12.5 11 14 11.5 14 10C14 9.34375 13.5 8.5 12.5 8.5C11.5 8.5 11 9 10.5 9.5"
      style={strokeStyle}
    />
  </svg>
)

export default HelpCircleIcon
