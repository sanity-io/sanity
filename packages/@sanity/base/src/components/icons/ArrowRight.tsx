// part:@sanity/base/arrow-right

import React from 'react'

const strokeStyle = {
  stroke: 'currentColor',
  strokeWidth: 1.2
}

const ArrowRightIcon = () => (
  <svg
    data-sanity-icon
    viewBox="0 0 25 25"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMidYMid"
    width="1em"
    height="1em"
  >
    <path d="M18.5 12.5H6" style={strokeStyle} />
    <path d="M13 7L18.5 12.5L13 18" style={strokeStyle} />
  </svg>
)

export default ArrowRightIcon
