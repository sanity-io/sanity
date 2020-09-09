// exported by PlusCircle.js
// exported by PlusCircleOutline.js

import React from 'react'

const strokeStyle = {
  stroke: 'currentColor',
  strokeWidth: 1.2
}

const AddCircle = () => (
  <svg
    data-sanity-icon
    viewBox="0 0 25 25"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMidYMid"
    width="1em"
    height="1em"
  >
    <circle cx="12.5" cy="12.5" r="8" style={strokeStyle} />
    <line x1="8" y1="12.4" x2="17" y2="12.4" style={strokeStyle} />
    <path d="M12.5 8V17" style={strokeStyle} />
  </svg>
)

export default AddCircle
