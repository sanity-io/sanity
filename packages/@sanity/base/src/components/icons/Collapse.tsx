// exported by FullscreenExit.js

import React from 'react'

const strokeStyle = {
  stroke: 'currentColor',
  strokeWidth: 1.2,
}

const CollapseIcon = () => (
  <svg
    data-sanity-icon
    viewBox="0 0 25 25"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMidYMid"
    width="1em"
    height="1em"
  >
    <path d="M14.5 10.5L19 6" style={strokeStyle} />
    <path d="M19 10.5H14.5V6" style={strokeStyle} />
    <path d="M6 14.5H10.5V19" style={strokeStyle} />
    <path d="M10.5 14.5L6 19" style={strokeStyle} />
  </svg>
)

export default CollapseIcon
