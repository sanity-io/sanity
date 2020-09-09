// part:@sanity/base/search-icon

import React from 'react'

const strokeStyle = {
  stroke: 'currentColor',
  strokeWidth: 1.2
}

export default function SearchIcon() {
  return (
    <svg
      data-sanity-icon
      viewBox="0 0 25 25"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid"
      width="1em"
      height="1em"
    >
      <circle cx="10.5" cy="10.5" r="5" style={strokeStyle} />
      <path d="M14 14L19 19" style={strokeStyle} />
    </svg>
  )
}
