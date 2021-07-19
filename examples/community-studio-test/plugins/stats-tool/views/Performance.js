import React from 'react'
import styles from '../StatsTool.css'
import ResponsiveBar from '../components/ResponsiveBar'
import ResponsiveLine from '../components/ResponsiveLine'

const Performance = ({ subset, activeSubset }) => {
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

  const firstResponseLine = subset.items && [
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
          "y": item.firstResponse ? item.firstResponse : null
        }
      })
    }
  ]

  const threadLengthLine = subset.items && [
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
          "y": item.threadLength ? item.threadLength : null
        }
      })
    }
  ]
  return (
    <>
      <h1>Support performance</h1>

      <div className={styles.row}>

        <div className={`${styles.widget} ${styles.halfWidth}`}>
          <h2>Coverage
            {subset.summary &&
              <span>
                <span>{Math.round(subset.summary.coverage[0].percentage) + '%'}</span>
              </span>
            }
          </h2>
          <div className={styles.statsContainer}>
            <ResponsiveBar
              data={subset.items ? subset.items : []}
              keys={[ 'answered', 'unanswered' ]}
              xLegend={unit}
              yLegend={'tickets'}
              indexBy={unit}
              showLegends
            />
          </div>
        </div>

        <div className={`${styles.widget} ${styles.halfWidth}`}>
          <h2>Resolution rate
            {subset.summary &&
              <span>
                <span>{Math.round(subset.summary.resolution[1].percentage) + '%'}</span>
              </span>
            }
          </h2>
          <div className={styles.statsContainer}>
            <ResponsiveBar
              data={subset.items ? subset.items : []}
              keys={[ 'open', 'resolved' ]}
              xLegend={unit}
              yLegend={'tickets'}
              indexBy={unit}
              showLegends
            />
          </div>
        </div>

      </div>
      <div className={styles.row}>

        <div className={`${styles.widget} ${styles.halfWidth}`}>
          <h2>Time to first response
            {subset.summary &&
              <span>
                <span>
                  {
                    Math.floor(subset.summary.firstResponse / 60) + 'h ' +
                    Math.round(subset.summary.firstResponse % 60) + 'm'
                  }
                </span>
              </span>
            }
          </h2>
          <div className={styles.statsContainer}>
            <ResponsiveLine
              data={firstResponseLine}
              xLegend={unit}
              yLegend={'minutes'}
              disableAnimation
            />
          </div>
        </div>

        <div className={`${styles.widget} ${styles.halfWidth}`}>
          <h2>Thread length
            {subset.summary &&
              <span>
                <span>{subset.summary.threadLength.toFixed(2)}</span>
              </span>
            }
          </h2>
          <div className={styles.statsContainer}>
            <ResponsiveLine
              data={threadLengthLine}
              xLegend={unit}
              yLegend={'messages'}
              disableAnimation
            />
          </div>
        </div>

      </div>

      <div className={styles.row}>

        <div className={`${styles.widget} ${styles.halfWidth}`}>
          <h2>Average resolution time</h2>
          <p>Coming soon</p>
        </div>

        <div className={`${styles.widget} ${styles.halfWidth}`}>
          <h2>Cadence</h2>
          <p>Coming soon</p>
        </div>

      </div>
    </>
  )
}

export default Performance
