import React from 'react'

const strokeStyle = {vectorEffect: 'non-scaling-stroke'}

const SignOutIcon = () => (
  <svg
    viewBox="0 0 25 25"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMidYMid"
    width="1em"
    height="1em"
  >
    <rect x="3.5" y="5.5" width="14" height="14" stroke="currentColor" style={strokeStyle} />
    <path d="M8 12.5H23M21 10L23.5 12.5L21 15" stroke="currentColor" style={strokeStyle} />
  </svg>
)

export default SignOutIcon
