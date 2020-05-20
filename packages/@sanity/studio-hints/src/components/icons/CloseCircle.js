import React from 'react'

const strokeStyle = {
  stroke: 'currentColor',
  strokeWidth: 1.2,
  vectorEffect: 'non-scaling-stroke'
}

export default function CloseCircle() {
  return (
    <svg
      viewBox="0 0 25 25"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid"
      width="1em"
      height="1em"
    >
      <circle cx="12.5" cy="12.5" r="8" style={strokeStyle} />
      <path d="M9.50001 15.5L15.5 9.49999" style={strokeStyle} />
      <path d="M9.5 9.5L15.5 15.5" style={strokeStyle} />
    </svg>
  )
}
