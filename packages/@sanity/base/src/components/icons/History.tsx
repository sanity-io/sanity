// part:@sanity/base/history-icon

import React from 'react'

const strokeStyle = {
  stroke: 'currentColor',
  strokeWidth: 1.2
}

const RestoreIcon = () => (
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
      d="M4.56189 13.5C4.52104 13.1724 4.5 12.8387 4.5 12.5C4.5 8.08172 8.08172 4.5 12.5 4.5C16.9183 4.5 20.5 8.08172 20.5 12.5C20.5 16.9183 16.9183 20.5 12.5 20.5C9.75033 20.5 7.32466 19.1128 5.88468 17"
      style={strokeStyle}
    />
    <path d="M7 11L4.56189 13.5L2 11" style={strokeStyle} />
    <path d="M12.5 8V12.5L15.5 15.5" style={strokeStyle} />
  </svg>
)

export default RestoreIcon
