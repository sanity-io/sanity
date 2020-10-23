// part:@sanity/base/package-icon

import React from 'react'

const strokeStyle = {
  stroke: 'currentColor',
  strokeWidth: 1.2,
}

const PackageIcon = () => (
  <svg
    data-sanity-icon
    viewBox="0 0 25 25"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMidYMid"
    width="1em"
    height="1em"
  >
    <path
      d="M12.5 4.5L5.5 9V16L12.5 20.5L19.5 16V9L12.5 4.5Z"
      stroke="currentColor"
      style={strokeStyle}
    />
    <path d="M5.5 9L12.5 13.5L19.5 9" stroke="currentColor" style={strokeStyle} />
    <path d="M12.5 13.5V20.5" stroke="currentColor" style={strokeStyle} />
    <path d="M9 6.5L16 11" stroke="currentColor" style={strokeStyle} />
  </svg>
)

export default PackageIcon
