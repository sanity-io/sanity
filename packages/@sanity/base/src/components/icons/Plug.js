import React from 'react'

const strokeStyle = {vectorEffect: 'non-scaling-stroke'}

const PlugIcon = () => (
  <svg
    viewBox="0 0 25 25"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMidYMid"
    width="1em"
    height="1em"
  >
    <path
      d="M8 13L6 15L9 18L11 16C13.5 17.5 15 18 17 16L18.5 14.5L9.5 5.5L8 7C6 9 6.5 10.5 8 13Z"
      stroke="currentColor"
      style={strokeStyle}
    />
    <path d="M12 8L17 3" stroke="currentColor" style={strokeStyle} />
    <path d="M16 12L21 7" stroke="currentColor" style={strokeStyle} />
    <path d="M7.5 16.5L2.5 21.5" stroke="currentColor" style={strokeStyle} />
  </svg>
)

export default PlugIcon
