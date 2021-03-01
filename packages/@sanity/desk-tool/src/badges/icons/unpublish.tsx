import React from 'react'

const strokeStyle = {
  stroke: 'currentColor',
  strokeWidth: 1,
}

export function UnpublishIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 13.5L3 13.5" style={strokeStyle} />
      <path d="M8.5 11L8.5 3" style={strokeStyle} />
      <path d="M12 7.5L8.5 11L5 7.5" style={strokeStyle} />
    </svg>
  )
}
