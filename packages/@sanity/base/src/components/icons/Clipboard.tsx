// part:@sanity/base/clipboard-icon

import React from 'react'

const strokeStyle = {
  stroke: 'currentColor',
  strokeWidth: 1.2,
}

export default function ClipboardIcon() {
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
      <path d="M11.5 5.5H6.5V19.5H18.5V5.5H13.5" style={strokeStyle} />
      <path d="M12.5 4L15 7.5H10L12.5 4Z" style={strokeStyle} />
    </svg>
  )
}
