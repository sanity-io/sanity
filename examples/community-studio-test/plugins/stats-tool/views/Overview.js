import React, { useEffect } from 'react'
import styles from '../StatsTool.css'
import ResponsiveBar from '../components/ResponsiveBar'
import ResponsiveLine from '../components/ResponsiveLine'
import ResponsivePie from '../components/ResponsivePie'

const Overview = ({ subset, activeSubset }) => {
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

  const ticketsLine = subset.items && [
    {
      "id": "current",
      "color": "hsl(51, 70%, 50%)",
      "data": subset.items.map(item => {
        let x = item.day

        switch(activeSubset) {
          case 'quarterly':
            x = item.week
            break
          case 'yearly':
            x = item.month
            break
          case 'all':
            x = item.quarter
            break
        }

        return {
          "x": x,
          "y": item.tickets ? item.tickets : null
        }
      })
    }
  ]
  const coverageLine = subset.items && [
    {
      "id": "current",
      "color": "hsl(51, 70%, 50%)",
      "data": subset.items.map(item => {
        let x = item.day

        switch(activeSubset) {
          case 'quarterly':
            x = item.week
            break
          case 'yearly':
            x = item.month
            break
          case 'all':
            x = item.quarter
            break
        }

        return {
          "x": x,
          "y": item.answered ? item.answered : null
        }
      })
    }
  ]
  const resolutionLine = subset.items && [
    {
      "id": "current",
      "color": "hsl(51, 70%, 50%)",
      "data": subset.items.map(item => {
        let x = item.day

        switch(activeSubset) {
          case 'quarterly':
            x = item.week
            break
          case 'yearly':
            x = item.month
            break
          case 'all':
            x = item.quarter
            break
        }

        return {
          "x": x,
          "y": item.resolved ? item.resolved : null
        }
      })
    }
  ]

  const agentsPie = subset.summary && subset.summary.agents && (
    subset.summary.agents.map(agent => ({
      "id": agent.name,
      "label": agent.name,
      "value": agent.percentage
    }))
  )

  return (
    <>
      <div className={styles.summary}>
        <div className={`${styles.widget} ${styles.thirdWidth}`}>
          <h3>Tickets</h3>
          <span>{subset.summary && subset.summary.volume}</span>
          <div className={styles.statsContainer}>
            {ticketsLine &&
              <ResponsiveLine
                data={ticketsLine}
                disableGrids
              />
            }
          </div>
        </div>
        <div className={`${styles.widget} ${styles.thirdWidth}`}>
          <h3>Coverage</h3>
          <span>{subset.summary && Math.round(subset.summary.coverage[0].percentage) + '%'}</span>
          <div className={styles.statsContainer}>
            {coverageLine &&
              <ResponsiveLine
                data={coverageLine}
                disableGrids
              />
            }
          </div>
        </div>
        <div className={`${styles.widget} ${styles.thirdWidth}`}>
          <h3>Resolution rate</h3>
          <span>{subset.summary && Math.round(subset.summary.resolution[1].percentage) + '%'}</span>
          <div className={styles.statsContainer}>
            {resolutionLine &&
              <ResponsiveLine
                data={resolutionLine}
                disableGrids
              />
            }
          </div>
        </div>
      </div>

      <div className={styles.widget}>
        <h2>
          {
            {
              'quarterly': 'Weekly tickets',
              'yearly': 'Monthly tickets',
              'all': 'Quarterly tickets',
            }[activeSubset] || 'Daily tickets'
          }
          {subset.summary && <span><em>n</em> = {subset.summary.volume}</span>}
        </h2>
        <div className={styles.statsContainer}>
          <ResponsiveBar
            data={subset.items ? subset.items : []}
            keys={[ 'tickets' ]}
            xLegend={unit}
            yLegend={'tickets'}
            indexBy={unit}
          />
        </div>
      </div>

      <div className={styles.row}>

        <div className={`${styles.widget} ${styles.halfWidth}`}>
          <h2>Trending topics</h2>
          {subset.summary && subset.summary.tags.length > 0 ? (
            <ul>
                <li>Topic<span>Count</span></li>
                {subset.summary.tags.slice(0,5).map((tag, index) => (
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

        <div className={`${styles.widget} ${styles.halfWidth}`}>
          <h2>Popular channels</h2>
          <ul>
            <li>Channel<span>Count</span></li>
            {subset.summary && subset.summary.channels &&
              subset.summary.channels.slice(0,5).map((channel, index) => (
                <li key={index}>
                  {index + 1}. {channel.name}
                  <span>{channel.absolute}</span>
                </li>
              )
            )}
          </ul>
        </div>

      </div>
    </>
  )
}

export default Overview
