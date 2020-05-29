// part:@sanity/base/calendar-icon

import React from 'react'

const strokeStyle = {
  stroke: 'currentColor',
  strokeWidth: 1.2
}

const CalendarIcon = () => (
  <svg
    data-sanity-icon
    viewBox="0 0 25 25"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMidYMid"
    width="1em"
    height="1em"
  >
    <path
      d="M4.5 10.5V19.5H20.5V10.5M4.5 10.5V5.5H20.5V10.5M4.5 10.5H12.5H20.5"
      style={strokeStyle}
    />
    <path d="M7.5 8V3" style={strokeStyle} />
    <path d="M20.5 13.5H4.5M20.5 16.5H4.5M16.5 10.5V19.5" style={strokeStyle} />
    <path d="M12.5 19.5V10.5" style={strokeStyle} />
    <path d="M8.5 10.5V19.5" style={strokeStyle} />
    <path d="M17.5 8V3" style={strokeStyle} />
  </svg>
)

export default CalendarIcon
