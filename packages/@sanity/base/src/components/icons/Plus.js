import React from 'react'

const strokeStyle = {vectorEffect: 'non-scaling-stroke'}

const PlusIcon = () => (
  <svg
    viewBox="0 0 25 25"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMidYMid"
    width="1em"
    height="1em"
  >
    <line x1="12.5" y1="4" x2="12.5" y2="21" stroke="currentColor" style={strokeStyle} />
    <line x1="4" y1="12.5" x2="21" y2="12.5" stroke="currentColor" style={strokeStyle} />
  </svg>
)

export default PlusIcon
