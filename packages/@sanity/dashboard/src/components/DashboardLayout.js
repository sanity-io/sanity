/* eslint-disable class-methods-use-this, no-console */
import React from 'react'
import widgetDefinitions from 'all:part:@sanity/dashboard/widget?'
import dashboardConfigs from 'all:part:@sanity/dashboard/config?'
import styles from '../styles/DashboardLayout.css'

class DashboardLayout extends React.Component {
  renderWidget(config) {
    const {name, options, layout} = config // eslint-disable-line no-unused-vars
    const widgetDefinition = widgetDefinitions.find(wid => wid.name === name)

    if (widgetDefinition) {
      // Need to apply layout to widget styling somehow
      const Widget = widgetDefinition.component
      const props = options || {}
      return <Widget {...props} />
    }

    console.error(
      `Unable to locate widget with name ${name} among ${widgetDefinitions
        .map(wid => wid.name)
        .join(', ')}`
    )
    return null
  }

  renderConfiguredDashboard() {
    const widgetConfigs = dashboardConfigs[dashboardConfigs.length - 1].widgets
    return widgetConfigs.map((widgetConfig, index) => {
      const key = `${widgetConfig.name}_${index}`
      return (
        <div key={key} className={styles.widget}>
          {this.renderWidget(widgetConfig)}
        </div>
      )
    })
  }

  render() {
    if (dashboardConfigs && dashboardConfigs.length > 0) {
      return <div className={styles.root}>{this.renderConfiguredDashboard()}</div>
    }
    return null
  }
}

export default DashboardLayout
