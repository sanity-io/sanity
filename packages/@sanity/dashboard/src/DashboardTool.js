import React from 'react'
import Dashboard from './containers/Dashboard'

const strokeStyle = {
  stroke: 'currentColor',
  strokeWidth: 1.2
}

const DashboardIcon = () => (
  <svg
    data-sanity-icon
    viewBox="0 0 25 25"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMidYMid"
    width="1em"
    height="1em"
  >
    <path d="M19.5 19.5H5.5V5.5H19.5V19.5Z" style={strokeStyle} />
    <path d="M5.5 12.5H19.5" style={strokeStyle} />
    <path d="M14.5 19.5V12.5M10.5 12.5V5.5" style={strokeStyle} />
  </svg>
)

export default {
  title: 'Dashboard',
  name: 'dashboard',
  icon: DashboardIcon,
  component: Dashboard
}
