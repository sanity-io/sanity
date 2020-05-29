// part:@sanity/base/format-quote-icon

import React from 'react'

const strokeStyle = {
  stroke: 'currentColor',
  strokeWidth: 1.2
}

export default function BlockquoteIcon() {
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
      <path d="M6 7.5H19" style={strokeStyle} />
      <path d="M10 12.5H17" style={strokeStyle} />
      <path d="M10 17.5H19" style={strokeStyle} />
      <path d="M6.5 12V18" style={strokeStyle} />
    </svg>
  )
}
