import React from 'react'
import DashboardLayout from './components/DashboardLayout'

const Icon = () => (
  <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M5 5H12V10V11V14H5V5ZM12 15H5V20H12V15ZM12 21H5H4V20V15V14V5V4H5H12H13H20H21V5V10V11V20V21H20H13H12ZM20 11H13V14V15V20H20V11ZM20 10V5H13V10H20Z"
      fill="currentColor"
    />
  </svg>
)

export default {
  title: 'Dashboard',
  name: 'dashboard',
  icon: Icon,
  component: DashboardLayout
}
