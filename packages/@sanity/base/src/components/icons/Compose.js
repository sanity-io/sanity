// part:@sanity/base/compose-icon

import React from 'react'

const strokeStyle = {
  stroke: 'currentColor',
  strokeWidth: 1.2
}

const ComposeIcon = () => (
  <svg
    data-sanity-icon
    viewBox="0 0 25 25"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMidYMid"
    width="1em"
    height="1em"
  >
    <path d="M14 5.5H5.5V19.5H19.5V11" style={strokeStyle} />
    <path d="M9.5 13.5L9 16L11.5 15.5L21 6L19 4L9.5 13.5Z" style={strokeStyle} />
    <path d="M17 6L19 8" style={strokeStyle} />
  </svg>
)

export default ComposeIcon
