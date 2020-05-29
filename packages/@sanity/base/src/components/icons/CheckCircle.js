// part:@sanity/base/circle-check-icon

import React from 'react'

const strokeStyle = {
  stroke: 'currentColor',
  strokeWidth: 1.2
}

const CheckmarkCircleIcon = () => (
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
    <path d="M9.5 12.1316L11.7414 14.5L16 10" style={strokeStyle} />
  </svg>
)

export default CheckmarkCircleIcon
