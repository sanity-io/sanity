// part:@sanity/base/lightbulb-icon

import React from 'react'

const strokeStyle = {
  stroke: 'currentColor',
  strokeWidth: 1.2,
}

const BulbOnIcon = () => (
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
      d="M15.5 17.212C15.5 16.1794 15.8273 15.1773 16.4272 14.3368C17.3978 12.9767 18 11.94 18 10C18 7 15.5 4.5 12.5 4.5C9.5 4.5 7 7 7 10C7 11.94 7.60216 12.9767 8.57284 14.3368C9.17266 15.1773 9.5 16.1794 9.5 17.212V18.5C9.5 19.0523 9.94772 19.5 10.5 19.5H14.5C15.0523 19.5 15.5 19.0523 15.5 18.5V17.212Z"
      style={strokeStyle}
    />
    <path d="M9.5 16.5H15.5" style={strokeStyle} />
    <path
      d="M11 20V20.5C11 21.0523 11.4477 21.5 12 21.5H13C13.5523 21.5 14 21.0523 14 20.5V20"
      style={strokeStyle}
    />
  </svg>
)

export default BulbOnIcon
