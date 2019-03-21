import React from 'react'
import {get} from 'lodash'
import dashboardConfig from 'part:@sanity/dashboard/config?'
import DashboardGrid from '../components/DashboardGrid'
import WidgetContainer from './WidgetContainer'

function DashboardLayout(props) {
  if (!dashboardConfig) {
    return null
  }

  const widgetConfigs = get(dashboardConfig, 'widgets', [])

  return (
    <DashboardGrid>
      {widgetConfigs.map((widgetConfig, index) => (
        <WidgetContainer key={String(index)} config={widgetConfig} />
      ))}
    </DashboardGrid>
  )
}

export default DashboardLayout
