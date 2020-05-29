// part:@sanity/base/error-outline-icon

import React from 'react'

const strokeStyle = {
  stroke: 'currentColor',
  strokeWidth: 1.2
}

export default function ErrorOutlineIcon() {
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
      <circle cx="12.5" cy="12.5" r="8" style={strokeStyle} />
      <path d="M12.5 16V14.5" style={strokeStyle} />
      <path d="M12.5 9V13" style={strokeStyle} />
    </svg>
  )
}
