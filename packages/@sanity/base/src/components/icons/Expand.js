// exported by Fullscreen.js

import React from 'react'

const strokeStyle = {
  stroke: 'currentColor',
  strokeWidth: 1.2
}

const ExpandIcon = () => (
  <svg
    viewBox="0 0 25 25"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMidYMid"
    width="1em"
    height="1em"
  >
    <path d="M14 6.5H18.5M18.5 6.5V11M18.5 6.5L14 11" style={strokeStyle} />
    <path d="M11 18.5H6.5M6.5 18.5L6.5 14M6.5 18.5L11 14" style={strokeStyle} />
  </svg>
)

ExpandIcon.sanityIcon = true

export default ExpandIcon
