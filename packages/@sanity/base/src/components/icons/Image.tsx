// part:@sanity/base/image-icon

import React from 'react'

const strokeStyle = {
  stroke: 'currentColor',
  strokeWidth: 1.2
}

const ImageIcon = () => (
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
    <path
      d="M5.5 15.5L8.79289 12.2071C9.18342 11.8166 9.81658 11.8166 10.2071 12.2071L12.8867 14.8867C13.2386 15.2386 13.7957 15.2782 14.1938 14.9796L15.1192 14.2856C15.3601 14.1049 15.6696 14.0424 15.9618 14.1154L19.5 15"
      style={strokeStyle}
    />
    <circle cx="14.5" cy="10.5" r="1" style={strokeStyle} />
  </svg>
)

export default ImageIcon
