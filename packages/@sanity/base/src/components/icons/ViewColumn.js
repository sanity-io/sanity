import React from 'react'

const strokeStyle = {vectorEffect: 'non-scaling-stroke'}

const ViewColumnIcon = () => (
  <svg
    viewBox="0 0 25 25"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMidYMid"
    width="1em"
    height="1em"
  >
    <rect x="3.5" y="4.5" width="18" height="16" stroke="currentColor" style={strokeStyle} />
    <line x1="9.5" y1="5" x2="9.5" y2="20" stroke="currentColor" style={strokeStyle} />
    <line x1="15.5" y1="5" x2="15.5" y2="20" stroke="currentColor" style={strokeStyle} />
  </svg>
)

export default ViewColumnIcon
