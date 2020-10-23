// exported by Time.js

import React from 'react'

const strokeStyle = {
  stroke: 'currentColor',
  strokeWidth: 1.2,
}

export default function ClockIcon() {
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
      <path d="M12.5 8V12.5L15.5 15.5" style={strokeStyle} />
      <circle cx="12.5" cy="12.5" r="8" style={strokeStyle} />
    </svg>
  )
}
