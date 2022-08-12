import React from 'react'
import DashboardLayout from '../components/DashboardLayout'
import WidgetGroup from '../components/WidgetGroup'
import {dashboardConfig} from '../legacyParts'

function Dashboard() {
  if (!dashboardConfig) {
    return null
  }

  const widgetConfigs = dashboardConfig.widgets || []
  const layoutWidth = dashboardConfig?.layout?.width || 'large'

  return (
    <DashboardLayout width={layoutWidth}>
      <WidgetGroup config={{widgets: widgetConfigs}} />
    </DashboardLayout>
  )
}

export default Dashboard
