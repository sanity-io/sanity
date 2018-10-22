import React from 'react'

const strokeStyle = {vectorEffect: 'non-scaling-stroke'}

const VisibilityIcon = () => (
  <svg
    viewBox="0 0 25 25"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMidYMid"
    width="1em"
    height="1em"
  >
    <path
      d="M12.5 6.5C7 6.5 3.5 10.5 2.5 12.5C3.5 14.5 7 18.5 12.5 18.5C18 18.5 21.5 14.5 22.5 12.5C21.5 10.5 18 6.5 12.5 6.5Z"
      stroke="currentColor"
      style={strokeStyle}
    />
    <circle cx="12.5" cy="12.5" r="4" stroke="currentColor" style={strokeStyle} />
  </svg>
)

export default VisibilityIcon
