// part:@sanity/base/eye-icon

import React from 'react'

const strokeStyle = {
  stroke: 'currentColor',
  strokeWidth: '1.2',
}

export default function EyeIcon() {
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
        d="M12.5 7.5C8.5 7.5 6 10 4.5 12.5C6 15 8.5 17.5 12.5 17.5C16.5 17.5 19 15 20.5 12.5C19 10 16.5 7.5 12.5 7.5Z"
        style={strokeStyle}
      />
      <circle cx="12.5" cy="12.5" r="2.5" fill="currentColor" style={strokeStyle} />
    </svg>
  )
}
