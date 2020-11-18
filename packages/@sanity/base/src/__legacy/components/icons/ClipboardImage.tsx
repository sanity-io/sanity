// part:@sanity/base/clipboard-image-icon

import React from 'react'

const strokeStyle = {
  stroke: 'currentColor',
  strokeWidth: 1.2,
}

export default function ClipboardImageIcon() {
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
      <path d="M11.5 5.5H6.5V19.5H9M13.5 5.5H18.5V10" style={strokeStyle} />
      <path d="M12.5 4L15 7.5H10L12.5 4Z" style={strokeStyle} />
      <rect x="10.5" y="11.5" width="10" height="10" style={strokeStyle} />
      <path
        d="M10.5 18.5L12.73 15.8983C13.1327 15.4285 13.8613 15.4335 14.2575 15.909L15.299 17.1588C15.6754 17.6105 16.3585 17.6415 16.7743 17.2257L16.9903 17.0097C17.2947 16.7053 17.7597 16.6298 18.1447 16.8223L20.5 18"
        style={strokeStyle}
      />
    </svg>
  )
}
