/* eslint-disable class-methods-use-this, no-console */
import React from 'react'
import widgetDefinitions from 'all:part:@sanity/dashboard/widget?'
import dashboardConfigs from 'all:part:@sanity/dashboard/config?'
import styles from '../styles/DashboardLayout.css'

class DashboardLayout extends React.Component {
  renderWidget(config) {
    const {name, options} = config
    const widgetDefinition = widgetDefinitions.find(wid => wid.name === name)
    if (widgetDefinition) {
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
    const sections = dashboardConfigs[dashboardConfigs.length - 1].sections
    return sections.map((section, index) => {
      const key = `${section.name}_${index}`

      if (Array.isArray(section)) {
        return (
          <div key={key} className={styles.row}>
            {section.map((sectionItem, innerIndex) => {
              const innerKey = `${sectionItem.name}_${index}_${innerIndex}`
              return (
                <div key={innerKey} className={styles.column}>
                  {this.renderWidget(sectionItem)}
                </div>
              )
            })}
          </div>
        )
      }

      return (
        <div key={key} className={styles.row}>
          <div className={styles.column}>{this.renderWidget(section)}</div>
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
