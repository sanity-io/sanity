import React from 'react'

const strokeStyle = {
  stroke: 'currentColor',
  strokeWidth: 1,
}

export function CreateIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 8.5H14" style={strokeStyle} />
      <path d="M8.5 3L8.5 14" style={strokeStyle} />
    </svg>
  )
}
