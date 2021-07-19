import React from 'react'
import styles from '../StatsTool.css'
import ResponsiveBar from '../components/ResponsiveBar'

const Activity = ({ subset, activeSubset }) => {
  return (
    <>
      <h1>Community activity</h1>
      <div className={`${styles.widget} ${styles.halfWidth}`}>
        <h2>Dependency: community project</h2>
        <p>This view will appear when we introduce new data points as part of the community project.</p>
      </div>
    </>
  )
}

export default Activity
