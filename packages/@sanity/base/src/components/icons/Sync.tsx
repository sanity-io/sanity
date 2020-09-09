// part:@sanity/base/sync-icon

import React from 'react'

const strokeStyle = {
  stroke: 'currentColor',
  strokeWidth: 1.2
}

const SyncIcon = () => (
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
      d="M13 4.5H12.5C8.08172 4.5 4.5 8.08172 4.5 12.5C4.5 15.6631 6.33576 18.3975 9 19.6958"
      style={strokeStyle}
    />
    <path d="M11 7.5L13.5 4.56189L10.5 2" style={strokeStyle} />
    <path
      d="M12 20.5H12.5C16.9183 20.5 20.5 16.9183 20.5 12.5C20.5 9.33688 18.6642 6.60253 16 5.30423"
      style={strokeStyle}
    />
    <path d="M14 17.5L11.5 20.4381L14.5 23" style={strokeStyle} />
  </svg>
)

export default SyncIcon
