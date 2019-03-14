/* eslint-disable class-methods-use-this, no-console */
import React from 'react'
import {get} from 'lodash'
import widgetDefinitions from 'all:part:@sanity/dashboard/widget?'
import dashboardConfig from 'part:@sanity/dashboard/config?'
import DashboardGrid from './DashboardGrid'
import WidgetWrapper from './WidgetWrapper'
import styles from './DashboardLayout.css'

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
        const key = `${name}_${index}`

        if (widgetDefinition) {
          const widgetOptions = {
            ...(widgetDefinition.options || {}),
            ...(widgetConfig.options || {})
          }
          const widgetLayout = {...(widgetDefinition.layout || {}), ...(widgetConfig.layout || {})}
          const Widget = widgetDefinition.component
          return (
            <WidgetWrapper key={key} {...widgetLayout}>
              <Widget {...widgetOptions} />
            </WidgetWrapper>
          )
        }

        return (
          <WidgetWrapper key={key}>
            <div className={styles.missingWidget}>
              <h4>{`Could not find the Dashboard Widget named "${name}" `}</h4>
              <p>
                Make sure your <code>sanity.json</code> file mentions such a widget and that it's an
                implementaion of <code>part:@sanity/dashboard/widget</code>
              </p>
            </div>
          </WidgetWrapper>
        )
      })}
    </DashboardGrid>
  )
}

export default DashboardLayout
