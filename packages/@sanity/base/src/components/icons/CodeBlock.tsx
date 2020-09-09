// part:@sanity/base/format-code-icon

import React from 'react'

const strokeStyle = {
  stroke: 'currentColor',
  strokeWidth: 1.2
}

export default function CodeBlockIcon() {
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
      <path d="M11 16L7.5 12.5L11 9" style={strokeStyle} />
      <rect x="3.6" y="4.6" width="17.8" height="15.8" style={strokeStyle} />
      <path d="M14 9L17.5 12.5L14 16" style={strokeStyle} />
    </svg>
  )
}
