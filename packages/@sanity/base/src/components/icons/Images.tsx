// part:@sanity/base/images-icon

import React from 'react'

const strokeStyle = {
  stroke: 'currentColor',
  strokeWidth: 1.2
}

const ImagesIcon = () => (
  <svg
    data-sanity-icon
    viewBox="0 0 25 25"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMidYMid"
    width="1em"
    height="1em"
  >
    <rect x="4.5" y="5.5" width="14" height="12" style={strokeStyle} />
    <path d="M18.5 7.5H20.5V19.5H6.5V17.5" style={strokeStyle} />
    <path
      d="M4.5 14.5L7.79289 11.2071C8.18342 10.8166 8.81658 10.8166 9.20711 11.2071L11.8867 13.8867C12.2386 14.2386 12.7957 14.2782 13.1938 13.9796L14.1192 13.2856C14.3601 13.1049 14.6696 13.0424 14.9618 13.1154L18.5 14"
      style={strokeStyle}
    />
    <circle cx="13.5" cy="9.5" r="1" style={strokeStyle} />
  </svg>
)

export default ImagesIcon
