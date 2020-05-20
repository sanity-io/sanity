import React from 'react'

const strokeStyle = {
  stroke: 'currentColor',
  strokeWidth: 1.2,
  vectorEffect: 'non-scaling-stroke'
}

export default function Plus() {
  return (
    <svg
      viewBox="0 0 25 25"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid"
      width="1em"
      height="1em"
    >
      <path d="M12.5 6V19M6 12.5H19" style={strokeStyle} />
    </svg>
  )
}
