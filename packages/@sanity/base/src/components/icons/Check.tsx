// part:@sanity/base/check-icon

import React from 'react'

const strokeStyle = {
  stroke: 'currentColor',
  strokeWidth: 1.2,
}

const CheckmarkIcon = () => (
  <svg
    data-sanity-icon
    viewBox="0 0 25 25"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMidYMid"
    width="1em"
    height="1em"
  >
    <path d="M5.5 12.5L10.5 17.5L20 8" style={strokeStyle} />
  </svg>
)

export default CheckmarkIcon
