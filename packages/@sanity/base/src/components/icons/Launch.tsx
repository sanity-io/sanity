// part:@sanity/base/launch-icon

import React from 'react'

const strokeStyle = {
  stroke: 'currentColor',
  strokeWidth: 1.2
}

const LaunchIcon = () => (
  <svg
    data-sanity-icon
    width="1em"
    height="1em"
    viewBox="0 0 25 25"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M15 5.5H5.5V19.5H19.5V10" style={strokeStyle} />
    <path d="M21.5 3.5L11.5 13.5" style={strokeStyle} />
    <path d="M17 3.5H21.5V8" style={strokeStyle} />
  </svg>
)

export default LaunchIcon
