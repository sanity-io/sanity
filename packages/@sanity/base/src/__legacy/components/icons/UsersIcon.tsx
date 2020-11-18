// part:@sanity/base/users-icon

import React from 'react'

const strokeStyle = {
  stroke: 'currentColor',
  strokeWidth: 1.2,
}

const UsersIcon = () => (
  <svg
    data-sanity-icon
    preserveAspectRatio="xMidYMid"
    width="1em"
    height="1em"
    viewBox="0 0 25 25"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M17.5 18.5H21.5C21.5 15 20.8416 14.1708 19.5 13.5C18.5 13 16.5 12.5 16.5 11C16.5 9.5 17.5 9 17.5 7C17.5 5 16.5 4 15 4C13.6628 4 12.723 4.79472 12.5347 6.38415"
      style={strokeStyle}
      strokeLinecap="round"
    />
    <path
      d="M6.5 15.5C5.5 16 4.5 17 4.5 20.5H17.5C17.5 17 16.8416 16.1708 15.5 15.5C14.5 15 12.5 14.5 12.5 13C12.5 11.5 13.5 11 13.5 9C13.5 7 12.5 6 11 6C9.5 6 8.5 7 8.5 9C8.5 11 9.5 11.5 9.5 13C9.5 14.5 7.5 15 6.5 15.5Z"
      style={strokeStyle}
    />
  </svg>
)

export default UsersIcon
