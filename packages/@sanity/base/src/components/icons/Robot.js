// part:@sanity/base/robot-icon

import React from 'react'

const strokeStyle = {
  stroke: 'currentColor',
  strokeWidth: 1.2
}

const RobotIcon = () => (
  <svg
    data-sanity-icon
    viewBox="0 0 25 25"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMidYMid"
    width="1em"
    height="1em"
  >
    <rect x="6.5" y="8.5" width="12" height="7" rx="2" style={strokeStyle} />
    <circle cx="10.5" cy="12" r="1" style={strokeStyle} />
    <circle cx="14.5" cy="12" r="1" style={strokeStyle} />
    <circle cx="12.5" cy="5" r="1.5" style={strokeStyle} />
    <path d="M12.5 8.5V6.5" style={strokeStyle} />
    <path
      d="M4.5 19.5C4.5 18.3954 5.39543 17.5 6.5 17.5H18.5C19.6046 17.5 20.5 18.3954 20.5 19.5V20.5H4.5V19.5Z"
      style={strokeStyle}
    />
    <path d="M12.5 15.5V17.5" style={strokeStyle} />
  </svg>
)

export default RobotIcon
