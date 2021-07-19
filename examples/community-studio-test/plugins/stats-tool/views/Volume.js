import React from 'react'
import styles from '../StatsTool.css'
import ResponsiveBar from '../components/ResponsiveBar'

const Volume = ({ subset, activeSubset }) => {
  let unit = 'day'

  switch(activeSubset) {
    case 'quarterly':
      unit = 'week'
      break
    case 'yearly':
      unit = 'month'
      break
    case 'all':
      unit = 'quarter'
      break
  }

  return (
    <>
      <h1>Support volume</h1>
      <div className={`${styles.widget}`}>
        <h2>Open tickets</h2>
        <p>Coming soon</p>
      </div>

      <div className={styles.row}>

        <div className={`${styles.widget} ${styles.halfWidth}`}>
          <h2>Inflow by channel</h2>
          <ul>
            <li>Channel<span>Count</span></li>
            {subset.summary && subset.summary.channels &&
              subset.summary.channels.map((channel, index) => (
                <li key={index}>
                  {index + 1}. {channel.name}
                  <span>{channel.absolute}</span>
                </li>
              )
            )}
          </ul>
        </div>

        <div className={`${styles.widget} ${styles.halfWidth}`}>
          <h2>Activity</h2>
          <div className={styles.statsContainer}>
            <ResponsiveBar
              data={subset.items ? subset.items : []}
              keys={[ 'activity' ]}
              xLegend={unit}
              yLegend={'messages'}
              indexBy={unit}
            />
          </div>
        </div>

      </div>
    </>
  )
}

export default Volume
