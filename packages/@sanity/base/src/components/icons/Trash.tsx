// part:@sanity/base/trash-icon

import React from 'react'

const strokeStyle = {
  stroke: 'currentColor',
  strokeWidth: 1.2,
}

export default function TrashIcon() {
  return (
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
        d="M16.574 19.5H8.42603C7.90349 19.5 7.46905 19.0977 7.42898 18.5767L6.5 6.5H18.5L17.571 18.5767C17.5309 19.0977 17.0965 19.5 16.574 19.5Z"
        style={strokeStyle}
      />
      <path d="M5 6.5H20" style={strokeStyle} />
      <path
        d="M10 6.5V4.5C10 3.94772 10.4477 3.5 11 3.5H14C14.5523 3.5 15 3.94772 15 4.5V6.5"
        style={strokeStyle}
      />
      <path d="M12.5 9V17M15.5 9L15 17M9.5 9L10 17" style={strokeStyle} />
    </svg>
  )
}
