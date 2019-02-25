/* eslint-disable class-methods-use-this, no-console */
import React from 'react'
import widgetDefinitions from 'all:part:@sanity/dashboard/widget?'
import dashboardConfigs from 'all:part:@sanity/dashboard/config?'
import DashboardGrid from './DashboardGrid'
import WidgetWrapper from './WidgetWrapper'

class DashboardLayout extends React.Component {
  renderWidget(config, index) {
    const {name, options, layout} = config // eslint-disable-line no-unused-vars
    const widgetDefinition = widgetDefinitions.find(wid => wid.name === name)

    if (widgetDefinition) {
      // Need to apply layout to widget styling somehow
      const Widget = widgetDefinition.component
      const props = options || {}
      return (
        <WidgetWrapper key={}`${name}_${index}`} {...layout}>
          <Widget {...props} />
        </WidgetWrapper>
      )
    }

    console.error(
      `Unable to locate widget with name ${name} among ${widgetDefinitions
        .map(wid => wid.name)
        .join(', ')}`
    )
    return null
  }

  render() {
    if (dashboardConfigs && dashboardConfigs.length > 0) {
      const widgetConfigs = dashboardConfigs[dashboardConfigs.length - 1].widgets
      return (
        <DashboardGrid>
          {widgetConfigs.map((widgetConfig, index) => {
            return this.renderWidget(widgetConfig, index)
          })}
        </DashboardGrid>
      )
    }
    return null
  }
}

export default DashboardLayout
