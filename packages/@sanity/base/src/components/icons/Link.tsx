// part:@sanity/base/link-icon

import React from 'react'

const strokeStyle = {
  stroke: 'currentColor',
  strokeWidth: '1.2',
}

export default function LinkIcon() {
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
        d="M11 12.5L12.5 14C13.281 14.781 14.719 14.781 15.5 14L18.5 11C19.281 10.219 19.281 8.78105 18.5 8L18 7.5C17.2189 6.71895 15.781 6.71895 15 7.5L13 9.5"
        style={strokeStyle}
      />
      <path
        d="M14 12.5C13.1667 11.6667 13.3333 11.8333 12.5 11C11.719 10.219 10.2811 10.219 9.50001 11L6.5 14C5.71896 14.7811 5.71895 16.219 6.5 17L7 17.5C7.78105 18.281 9.21895 18.281 10 17.5L12 15.5"
        style={strokeStyle}
      />
    </svg>
  )
}
