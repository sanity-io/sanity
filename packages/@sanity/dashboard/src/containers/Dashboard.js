import React from 'react'
import dashboardConfig from 'part:@sanity/dashboard/config?'
import DashboardLayout from '../components/DashboardLayout'
import WidgetGroup from '../components/WidgetGroup'

function Dashboard(props) {
  if (!dashboardConfig) {
    return null
  }

  const widgetConfigs = dashboardConfig.widgets || []

  return (
    <DashboardLayout>
      <WidgetGroup config={{widgets: widgetConfigs}} />
    </DashboardLayout>
  )
}

export default Dashboard
