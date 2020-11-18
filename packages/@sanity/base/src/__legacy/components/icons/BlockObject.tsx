// part:@sanity/base/block-object-icon

import React from 'react'

const strokeStyle = {
  stroke: 'currentColor',
  strokeWidth: 1.2,
}

const BlockObjectIcon = () => (
  <svg
    data-sanity-icon
    viewBox="0 0 25 25"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMidYMid"
    width="1em"
    height="1em"
  >
    <path d="M5 19.5H20" style={strokeStyle} />
    <path d="M5 5.5H20" style={strokeStyle} />
    <rect x="6.5" y="8.5" width="12" height="8" style={strokeStyle} />
  </svg>
)

export default BlockObjectIcon
