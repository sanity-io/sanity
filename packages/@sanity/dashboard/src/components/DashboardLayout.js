/* eslint-disable class-methods-use-this, no-console, react/no-multi-comp */
import React from 'react'
import {get} from 'lodash'
import widgetDefinitions from 'all:part:@sanity/dashboard/widget?'
import dashboardConfig from 'part:@sanity/dashboard/config?'
import DashboardGrid from './DashboardGrid'
import WidgetWrapper from './WidgetWrapper'
import styles from './DashboardLayout.css'

function Widget(props) {
  const {name} = props.config
  const widgetDefinition = widgetDefinitions.find(wid => wid.name === name)

  if (widgetDefinition) {
    const widgetOptions = {
      ...(widgetDefinition.options || {}),
      ...(props.config.options || {})
    }
    const widgetLayout = {...(widgetDefinition.layout || {}), ...(props.config.layout || {})}
    return (
      <WidgetWrapper {...widgetLayout}>
        {React.createElement(widgetDefinition.component, widgetOptions)}
      </WidgetWrapper>
    )
  }

  return (
    <WidgetWrapper>
      <div className={styles.missingWidget}>
        <h4>{`Could not find the Dashboard Widget named "${name}" `}</h4>
        <p>
          Make sure your <code>sanity.json</code> file mentions such a widget and that it’s an
          implementaion of <code>part:@sanity/dashboard/widget</code>
        </p>
      </div>
    </WidgetWrapper>
  )
}

function WidgetGroup(props) {
  const config = props.config || {}
  const widgets = config.widgets || []
  const layout = config.layout || {}
  return (
    <div
      className={styles.widgetGroup}
      data-width={layout.width || 'auto'}
      data-height={layout.height || 'auto'}
    >
      {widgets.map((widgetConfig, index) => {
        if (widgetConfig.type === '__experimental_group') {
          return <WidgetGroup key={String(index)} config={widgetConfig} />
        }

        return <Widget key={String(index)} config={widgetConfig} />
      })}
    </div>
  )
}

function DashboardLayout(props) {
  if (!dashboardConfig) {
    return null
  }

  const widgetConfigs = get(dashboardConfig, 'widgets', [])
  return (
    <DashboardGrid>
      {widgetConfigs.map((widgetConfig, index) => {
        if (widgetConfig.type === '__experimental_group') {
          return <WidgetGroup key={String(index)} config={widgetConfig} />
        }

        return <Widget key={String(index)} config={widgetConfig} />
      })}
    </DashboardGrid>
  )
}

export default DashboardLayout
