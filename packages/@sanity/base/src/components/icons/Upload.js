// part:@sanity/base/upload-icon

import React from 'react'

const strokeStyle = {
  stroke: 'currentColor',
  strokeWidth: 1.2
}

export default function UploadIcon() {
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
      <path d="M19.5 15.5H5.5V19.5H19.5V15.5Z" style={strokeStyle} />
      <path d="M12.5 6.00003V15.5" style={strokeStyle} />
      <path d="M7.5 11L12.5 6.00003L17.5 11" style={strokeStyle} />
    </svg>
  )
}
