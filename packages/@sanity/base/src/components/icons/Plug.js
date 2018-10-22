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
      d="M9 14L7 16L10 19L12 17C14.5 18.5 16 19 18 17L19.5 15.5L10.5 6.5L9 8C7 10 7.5 11.5 9 14Z"
      stroke="currentColor"
      style={strokeStyle}
    />
    <path d="M13 9L18 4" stroke="currentColor" style={strokeStyle} />
    <path d="M17 13L22 8" stroke="currentColor" style={strokeStyle} />
    <path d="M8.5 17.5L4.5 21.5" stroke="currentColor" style={strokeStyle} />
  </svg>
)

export default PlugIcon
