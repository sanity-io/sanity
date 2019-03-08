/* eslint-disable class-methods-use-this, no-console */
import React from 'react'
import {get} from 'lodash'
import widgetDefinitions from 'all:part:@sanity/dashboard/widget?'
import dashboardConfig from 'part:@sanity/dashboard/config?'
import DashboardGrid from './DashboardGrid'
import WidgetWrapper from './WidgetWrapper'

function DashboardLayout(props) {
  if (!dashboardConfig) {
    return null
  }

  const widgetConfigs = get(dashboardConfig, 'widgets', [])
  return (
    <DashboardGrid>
      {widgetConfigs.map((widgetConfig, index) => {
        const {name} = widgetConfig
        const widgetDefinition = widgetDefinitions.find(wid => wid.name === name)
        const widgetOptions = {...(widgetDefinition.options || {}), ...(widgetConfig.options || {})}
        const widgetLayout = {...(widgetDefinition.layout || {}), ...(widgetConfig.layout || {})}

        if (widgetDefinition) {
          const Widget = widgetDefinition.component
          const key = `${name}_${index}`
          return (
            <WidgetWrapper key={key} {...widgetLayout}>
              <Widget {...widgetOptions} />
            </WidgetWrapper>
          )
        }

        console.error(
          `Unable to locate widget with name ${name} among ${widgetDefinitions
            .map(wid => wid.name)
            .join(', ')}`
        )
        return null
      })}
    </DashboardGrid>
  )
}

export default DashboardLayout
