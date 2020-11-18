// part:@sanity/base/sort-icon

import React from 'react'

const strokeStyle = {
  stroke: 'currentColor',
  strokeWidth: 1.2,
}

const SortIcon = () => (
  <svg
    data-sanity-icon
    viewBox="0 0 25 25"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMidYMid"
    width="1em"
    height="1em"
  >
    <path d="M16.5 19V7" style={strokeStyle} />
    <path d="M8.5 18V6" style={strokeStyle} />
    <path d="M12 15L8.5 18.5L5 15" style={strokeStyle} />
    <path d="M13 10L16.5 6.5L20 10" style={strokeStyle} />
  </svg>
)

export default SortIcon
