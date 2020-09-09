// part:@sanity/base/sign-out-icon

import React from 'react'

const strokeStyle = {
  stroke: 'currentColor',
  strokeWidth: 1.2
}

const LeaveIcon = () => (
  <svg
    data-sanity-icon
    viewBox="0 0 25 25"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMidYMid"
    width="1em"
    height="1em"
  >
    <path d="M16.5 15V19.5H5.5V5.5H16.5V10" style={strokeStyle} />
    <path d="M10 12.5H22M20 10L22.5 12.5L20 15" style={strokeStyle} />
  </svg>
)

export default LeaveIcon
