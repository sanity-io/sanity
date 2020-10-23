// part:@sanity/base/th-large-icon

import React from 'react'

const strokeStyle = {
  stroke: 'currentColor',
  strokeWidth: 1.2,
}

const ThLargeIcon = () => (
  <svg
    data-sanity-icon
    viewBox="0 0 25 25"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMidYMid"
    width="1em"
    height="1em"
  >
    <rect x="5.5" y="6.5" width="14" height="12" style={strokeStyle} />
    <path d="M12.5 6.5V18.5M19.5 12.5H5.5" style={strokeStyle} />
  </svg>
)

export default ThLargeIcon
