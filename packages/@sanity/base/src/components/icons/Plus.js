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
    <path d="M12.5 4V21M4 12.5H21" stroke="currentColor" style={strokeStyle} />
  </svg>
)

export default PlusIcon
