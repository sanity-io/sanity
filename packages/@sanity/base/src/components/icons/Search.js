import React from 'react'

const strokeStyle = {vectorEffect: 'non-scaling-stroke'}

const SearchIcon = () => (
  <svg
    viewBox="0 0 25 25"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMidYMid"
    width="1em"
    height="1em"
  >
    <circle cx="10.5" cy="10.5" r="6" stroke="currentColor" style={strokeStyle} />
    <line
      x1="14.6036"
      y1="14.6464"
      x2="20.6069"
      y2="20.6498"
      stroke="currentColor"
      style={strokeStyle}
    />
  </svg>
)

export default SearchIcon
