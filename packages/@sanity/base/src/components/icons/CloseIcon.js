import React from 'react'

const strokeStyle = {vectorEffect: 'non-scaling-stroke'}

const CloseIcon = () => (
  <svg
    viewBox="0 0 25 25"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMidYMid"
    width="1em"
    height="1em"
  >
    <path d="M19 6L6 19M6 6L19 19" stroke="currentColor" style={strokeStyle} />
  </svg>
)

export default CloseIcon
