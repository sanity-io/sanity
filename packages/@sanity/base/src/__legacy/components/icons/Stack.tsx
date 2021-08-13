// part:@sanity/base/stack-icon

import React from 'react'

const strokeStyle = {
  stroke: 'currentColor',
  strokeWidth: 1.2,
}

const StackIcon = () => (
  <svg
    data-sanity-icon
    viewBox="0 0 25 25"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMidYMid"
    width="1em"
    height="1em"
  >
    <path d="M19.5 12.5H5.5V6.5H19.5V12.5Z" style={strokeStyle} />
    <path d="M19.5 18.5H5.5V12.5H19.5V18.5Z" style={strokeStyle} />
  </svg>
)

export default StackIcon
