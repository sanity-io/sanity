import React from 'react'
import styles from '../StatsTool.css'
import ResponsiveBar from '../components/ResponsiveBar'
import ResponsivePie from '../components/ResponsivePie'

const Distribution = ({ subset, activeSubset }) => {
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

  const agentsPie = subset.summary && subset.summary.agents && (
    subset.summary.agents.map(agent => ({
      "id": agent.name,
      "label": agent.name,
      "value": agent.percentage
    }))
  )

  return (
    <>
      <h1>Support distribution</h1>

      <div className={`${styles.widget}`}>
        <h2>Top 10 topics</h2>
        <div className={styles.statsContainer}>
          {subset.summary && subset.summary.tags.length > 0 ? (
            <ResponsiveBar
              data={subset.summary.tags.slice(0,10)}
              keys={[ 'absolute' ]}
              xLegend={'topic'}
              yLegend={'tickets'}
              indexBy={'name'}
            />
          ) : (
            <p>No topics found in this subset. Please check if any tickets are tagged or try selecting a different subset.</p>
          )}
        </div>
      </div>
      <div className={styles.row}>

        <div className={`${styles.widget} ${styles.halfWidth}`}>
          <h2>Agents</h2>
            <div className={styles.statsContainer}>
              {agentsPie.length > 0 ? (
                <ResponsivePie data={agentsPie} />
              ) : (
                <p>No agents found in this subset. Please check if any tickets have agents or try selecting a different subset.</p>
              )
              }
            </div>
        </div>

        <div className={`${styles.widget} ${styles.halfWidth}`}>
          <h2>Follow-up actions</h2>
          {subset.summary && subset.summary.categories && subset.summary.categories.length > 0 ? (
            <div className={styles.statsContainer}>
                <ResponsiveBar
                  data={subset.summary.categories}
                  keys={[ 'absolute' ]}
                  xLegend={'action'}
                  yLegend={'count'}
                  indexBy={'name'}
                />
            </div>
          ) : (
            <p>No categories found in this subset. Please check if any tickets have assigned categories or try selecting a different subset.</p>
          )}
        </div>

      </div>

      <div className={styles.widget}>
        <h2>Topics</h2>
        {subset.summary && subset.summary.tags.length > 0 ? (
          <ul>
              <li>Topic<span>Count</span></li>
              {subset.summary.tags.map((tag, index) => (
                  <li key={index}>
                    {index + 1}. {tag.name}
                    <span>{tag.absolute}</span>
                  </li>
                )
              )}
          </ul>
        ) : (
          <p>No topics found in this subset. Please check if any tickets are tagged or try selecting a different subset.</p>
        )}
      </div>
    </>
  )
}

export default Distribution
