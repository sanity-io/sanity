// part:@sanity/base/eye-icon

import React from 'react'

const strokeStyle = {
  stroke: 'currentColor',
  strokeWidth: '1.2'
}

export default function EyeClosedIcon() {
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
      <path d="M4.5 12.5C6 15 8.5 17.5 12.5 17.5C16.5 17.5 19 15 20.5 12.5" style={strokeStyle} />
      <path d="M15.5 17L16.5 19.5" style={strokeStyle} />
      <path d="M7 15.5L5.5 17.5" style={strokeStyle} />
      <path d="M12.5 17.5V20" style={strokeStyle} />
      <path d="M18 15.5L19.5 17.5" style={strokeStyle} />
      <path d="M9.5 17L8.5 19.5" style={strokeStyle} />
    </svg>
  )
}
