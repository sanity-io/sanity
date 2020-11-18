// part:@sanity/base/binary-icon

import React from 'react'

const strokeStyle = {
  stroke: 'currentColor',
  strokeWidth: 1.2,
}

const BinaryDocumentIcon = () => (
  <svg
    data-sanity-icon
    viewBox="0 0 25 25"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMidYMid"
    width="1em"
    height="1em"
  >
    <path d="M10.5 4.5H18.5V20.5H6.5V8.5L10.5 4.5Z" style={strokeStyle} />
    <path d="M10.5 4.5V8.5H6.5" style={strokeStyle} />
    <path
      d="M10.1 11.5V10.9H8.9V11.5H10.1ZM8.9 16.5V17.1H10.1V16.5H8.9ZM8.9 11.5V16.5H10.1V11.5H8.9Z"
      fill="currentColor"
    />
    <path d="M12.5 16.5V11.5H15.5V16.5H12.5Z" style={strokeStyle} />
  </svg>
)

export default BinaryDocumentIcon
