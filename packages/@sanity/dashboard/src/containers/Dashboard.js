import React from 'react'
import DashboardLayout from '../components/DashboardLayout'
import WidgetGroup from '../components/WidgetGroup'
import {dashboardConfig} from '../legacyParts'

function Dashboard() {
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
