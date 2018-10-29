import React from 'react'

const strokeStyle = {vectorEffect: 'non-scaling-stroke'}

const MoreVertIcon = () => (
  <svg
    viewBox="0 0 25 25"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMidYMid"
    width="1em"
    height="1em"
  >
    <circle cx="12.5" cy="6.5" r="1.5" fill="currentColor" style={strokeStyle} />
    <circle cx="12.5" cy="12.5" r="1.5" fill="currentColor" style={strokeStyle} />
    <circle cx="12.5" cy="18.5" r="1.5" fill="currentColor" style={strokeStyle} />
  </svg>
)

export default MoreVertIcon
