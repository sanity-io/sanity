import React from 'react'

const strokeStyle = {
  stroke: 'currentColor',
  strokeWidth: 1.2,
}

export function HistoryIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M3.10209 9.18006C3.07431 8.95729 3.06 8.73035 3.06 8.50006C3.06 5.49563 5.49557 3.06006 8.5 3.06006C11.5044 3.06006 13.94 5.49563 13.94 8.50006C13.94 11.5045 11.5044 13.9401 8.5 13.9401C6.63022 13.9401 4.98076 12.9967 4.00158 11.5601"
        style={strokeStyle}
      />
      <path d="M4.75999 7.47998L3.10207 9.17998L1.35999 7.47998" style={strokeStyle} />
      <path d="M8.5 5.43994V8.49994L10.54 10.5399" style={strokeStyle} />
    </svg>
  )
}
