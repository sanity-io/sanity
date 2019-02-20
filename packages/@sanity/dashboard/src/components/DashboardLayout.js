import React from 'react'
import Widgets from 'all:part:@sanity/dashboard-widget?'
import styles from '../styles/DashboardLayout.css'

class DashboardLayout extends React.Component {
  render() {
    return (
      <div className={styles.container}>
        <h1>Dashboard</h1>
        {Widgets &&
          Widgets.map(Widget => {
            return (
              <div key={Widget.name} className={styles.widgetContainer}>
                <Widget />
              </div>
            )
          })}
      </div>
    )
  }
}

export default DashboardLayout
