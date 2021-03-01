import React from 'react'

const strokeStyle = {
  stroke: 'currentColor',
  strokeWidth: 1,
}

export function EditIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4.5 10.5L4 13L6.5 12.5L14 5L12 3L4.5 10.5Z" style={strokeStyle} />
      <path d="M10 5L12 7" style={strokeStyle} />
    </svg>
  )
}
