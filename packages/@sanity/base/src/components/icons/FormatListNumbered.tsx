// part:@sanity/base/format-list-numbered-icon

import React from 'react'

const strokeStyle = {
  stroke: 'currentColor',
  strokeWidth: '1.2'
}

export default function OlistIcon() {
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
      <path d="M10 7.5H19" style={strokeStyle} />
      <path d="M10 12.5H19" style={strokeStyle} />
      <path d="M10 17.5H19" style={strokeStyle} />
      <path d="M5 18.5H7.5L7 17.5L7.5 16.5H5" style={strokeStyle} />
      <path d="M5 8.5H6.5M8 8.5H6.5M5 6.5H6.5V8.5" style={strokeStyle} />
      <path d="M8 13.5H6L7 11.5H5" style={strokeStyle} />
    </svg>
  )
}
