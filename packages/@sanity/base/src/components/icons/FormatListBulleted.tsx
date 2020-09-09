// part:@sanity/base/format-list-bulleted-icon

import React from 'react'

const strokeStyle = {
  stroke: 'currentColor',
  strokeWidth: '1.2'
}

export default function UlistIcon() {
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
      <circle cx="6.5" cy="7.5" r="1.5" fill="currentColor" />
      <circle cx="6.5" cy="12.5" r="1.5" fill="currentColor" />
      <circle cx="6.5" cy="17.5" r="1.5" fill="currentColor" />
      <path d="M10 7.5H19" style={strokeStyle} />
      <path d="M10 12.5H19" style={strokeStyle} />
      <path d="M10 17.5H19" style={strokeStyle} />
    </svg>
  )
}
