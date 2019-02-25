import React from 'react'
import styles from './StackOverview.css'

class StackOverview extends React.Component {
  render() {
    return (
      <div className={styles.container}>
        <h2 className={styles.title}>About your stack</h2>
      </div>
    )
  }
}

export default {
  name: 'stack-overview',
  component: StackOverview
}
