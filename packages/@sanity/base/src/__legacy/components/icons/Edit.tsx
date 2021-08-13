// part:@sanity/base/edit-icon

import React from 'react'

const strokeStyle = {
  stroke: 'currentColor',
  strokeWidth: 1.2,
}

export default function EditIcon() {
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
      <path d="M7 15L6 19L10 18L20 8L17 5L7 15Z" style={strokeStyle} />
      <path d="M15 7L18 10" style={strokeStyle} />
    </svg>
  )
}
