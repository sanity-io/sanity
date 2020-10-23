// part:@sanity/base/inline-object-icon

import React from 'react'

const strokeStyle = {
  stroke: 'currentColor',
  strokeWidth: 1.2,
}

const InlineObjectIcon = () => (
  <svg
    data-sanity-icon
    viewBox="0 0 25 25"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMidYMid"
    width="1em"
    height="1em"
  >
    <rect x="8.5" y="6.5" width="8" height="12" style={strokeStyle} />
    <path d="M5.5 5V20" style={strokeStyle} />
    <path d="M19.5 5V20" style={strokeStyle} />
  </svg>
)

export default InlineObjectIcon
