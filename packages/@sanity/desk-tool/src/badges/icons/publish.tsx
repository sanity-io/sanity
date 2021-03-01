import React from 'react'

const strokeStyle = {
  stroke: 'currentColor',
  strokeWidth: 1,
}

export function PublishIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 3.5H14" style={strokeStyle} />
      <path d="M8.5 6V14" style={strokeStyle} />
      <path d="M5 9.5L8.5 6L12 9.5" style={strokeStyle} />
    </svg>
  )
}
