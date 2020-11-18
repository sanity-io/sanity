// part:@sanity/base/format-underlined-icon

import React from 'react'

const strokeStyle = {
  stroke: 'currentColor',
  strokeWidth: '1.2',
}

export default function UnderlineIcon() {
  return (
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
        d="M9.52791 7.11409H8.17V14.2582C8.17 16.5817 9.79195 18.2565 12.4927 18.2565C15.1934 18.2565 16.8154 16.5817 16.8154 14.2582V7.11409H15.4574V14.1677C15.4574 15.8123 14.3787 17.0042 12.4927 17.0042C10.6067 17.0042 9.52791 15.8123 9.52791 14.1677V7.11409Z"
        fill="currentColor"
      />
      <path d="M7 20.5H18" style={strokeStyle} />
    </svg>
  )
}
