import React from 'react'

const strokeStyle = {
  stroke: 'currentColor',
  strokeWidth: 1,
}

export function DeleteIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M10.605 13.5H6.39504C5.88549 13.5 5.45743 13.1169 5.40116 12.6104L4.5 4.5H12.5L11.5988 12.6104C11.5426 13.1169 11.1145 13.5 10.605 13.5Z"
        style={strokeStyle}
      />
      <path d="M7 12L6.375 6M10 12L10.625 6" style={strokeStyle} />
      <path d="M8.5 6V12" style={strokeStyle} />
      <path d="M3 4.5H14" style={strokeStyle} />
      <path
        d="M6.5 4.5V3.5C6.5 2.94772 6.94772 2.5 7.5 2.5H9.5C10.0523 2.5 10.5 2.94772 10.5 3.5V4.42"
        style={strokeStyle}
      />
    </svg>
  )
}
