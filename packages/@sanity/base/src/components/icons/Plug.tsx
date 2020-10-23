// part:@sanity/base/plugin-icon

import React from 'react'

const strokeStyle = {
  stroke: 'currentColor',
  strokeWidth: 1.2,
}

export default function PlugIcon() {
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
        d="M9 12L7 14L10 17L12 15C14 16.5 15 16 16 15L17.5 13.5L10.5 6.5L9 8C8 9 7.5 10 9 12Z"
        style={strokeStyle}
      />
      <path d="M12.5 8.5L16 5" style={strokeStyle} />
      <path d="M15.5 11.5L19 8" style={strokeStyle} />
      <path d="M8.5 15.5L4.5 19.5" style={strokeStyle} />
    </svg>
  )
}
