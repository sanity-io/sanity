// part:@sanity/base/spinner-icon

import React from 'react'

const strokeStyle = {
  stroke: 'currentColor',
  strokeWidth: 1.2
}

export default function SpinnerIcon() {
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
      <path
        d="M5.5 12.5C5.5 16.9183 9.08172 20.5 13.5 20.5C17.9183 20.5 21.5 16.9183 21.5 12.5C21.5 8.08172 17.9183 4.5 13.5 4.5"
        style={strokeStyle}
      />
    </svg>
  )
}
