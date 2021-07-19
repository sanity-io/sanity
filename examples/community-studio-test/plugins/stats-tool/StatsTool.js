import React, { useEffect, useState } from 'react'
import styles from './StatsTool.css'
import client from 'part:@sanity/base/client'
import Activity from './views/Activity'
import Contribution from './views/Contribution'
import Distribution from './views/Distribution'
import Overview from './views/Overview'
import Performance from './views/Performance'
import Volume from './views/Volume'

const StatsTool = () => {
  const [section, setSection] = useState('overview')
  const [activeSubset, setActiveSubset] = useState('weekly')
  const [weekly, setWeekly] = useState([])
  const [quarterly, setQuarterly] = useState([])
  const [monthly, setMonthly] = useState([])
  const [yearly, setYearly] = useState([])
  const [all, setAll] = useState([])
  const [subset, setSubset] = useState([])
  let subscription

  const changeSection = section => {
    setSection(section)
    document.getElementById('stats').scrollIntoView()
  }

  const switchSubset = subset => {
    setActiveSubset(subset)
    switch(subset) {
      case 'monthly':
        return setSubset(monthly)
      case 'quarterly':
        return setSubset(quarterly)
      case 'yearly':
        return setSubset(yearly)
      case 'all':
        return setSubset(all)
      default:
        return setSubset(weekly)
    }
  }

  useEffect(() => {
    const filter = `*[
      _type == 'aggregate' &&
      !(_id in path('drafts.**')) &&
      subset == 'all'
    ][0]`

    const fragment = `
      _id,
      activity,
      agents[] {
        absolute,
        name,
        percentage
      },
      categories[] {
        absolute,
        name,
        percentage
      },
      channels[] {
        absolute,
        name,
        percentage
      },
      coverage[] {
        absolute,
        name,
        percentage
      },
      dateFrom,
      dateTo,
      firstResponse,
      resolution[] {
        absolute,
        name,
        percentage
      },
      responseTime,
      subset,
      tags[] {
        absolute,
        name,
        percentage
      },
      threadLength,
      volume
    `

    const projection = `{
      'sevenDays': sources[]->[subset == '7-days']{ ${fragment} },
      'thirtyDays': sources[]->[subset == '30-days']{ ${fragment} },
      'days': sources[-1]->sources[]->{ ${fragment} },
      'weeks': sources[0]->sources[]->[subset == 'week'][-12..-1]{ ${fragment} },
      'months': sources[0]->sources[]->[subset == 'month']{ ${fragment} },
      'quarters': sources[]->[subset == 'quarter']{ ${fragment} },
      'years': sources[]->[subset == 'year']{ ${fragment} },
      'all': { ${fragment} }
    }`

    const query = [filter, projection].join(' ')

    const fetchData = async () => {
      await client.fetch(query).then(data => {
        const prepareItems = (subset, unit) => {
          return subset.map(doc => ({
            "day": !unit ? new Date(doc.dateFrom).toLocaleString('en-US', { day: '2-digit' }) : 0,
            "week": unit == 'week' ? doc._id.split('-')[1] : 0,
            "month": unit == 'month' ? doc._id.split('-')[1] : 0,
            "quarter": unit == 'quarter' ? doc._id.split('-')[1] : 0,
            "tickets": doc.volume && doc.volume,
            "answered": doc.coverage && doc.coverage[0].absolute,
            "unanswered": doc.coverage && doc.coverage[1].absolute,
            "open": doc.resolution && doc.resolution[0].absolute,
            "resolved": doc.resolution && doc.resolution[1].absolute,
            "firstResponse": doc.firstResponse && doc.firstResponse,
            "responseTime": doc.responseTime && doc.responseTime,
            "threadLength": doc.threadLength && Math.round(doc.threadLength),
            "activity": doc.activity
          }))
        }

        const thirtyDayItems = prepareItems(data.days)
        const sevenDayItems = thirtyDayItems.slice(-7)

        const sevenDays = {
          summary: data.sevenDays[0],
          items: sevenDayItems
        }
        setWeekly(sevenDays)
        setSubset(sevenDays)

        const thirtyDays = {
          summary: data.thirtyDays[0],
          items: thirtyDayItems
        }
        setMonthly(thirtyDays)

        const quarters = {
          summary: data.quarters[0],
          items: prepareItems(data.weeks, 'week')
        }
        setQuarterly(quarters)

        const years = {
          summary: data.years[0],
          items: prepareItems(data.months, 'month')
        }
        setYearly(years)

        const allTime = {
          summary: data.all,
          items: prepareItems(data.quarters, 'quarter').reverse()
        }
        setAll(allTime)
      })
    }

    const listen = () => {
      subscription = client
        .listen(`*[
          _type == 'aggregate' &&
          !(_id in path('drafts.**'))
        ]`, { visibility: 'query' })
        .subscribe(() => fetchData())
    }

    fetchData().then(listen)

    return function cleanup() {
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [])
  return (
    <div className={styles.container}>
      <ul className={styles.list}>
        <li className={styles.listItem}>
          <span>Support stats</span>
        </li>
        <li className={`${styles.listItem} ${section == 'overview' ? styles.active : ''}`}>
          <button onClick={() => changeSection('overview')}>Overview</button>
        </li>
        <li className={`${styles.listItem} ${section == 'distribution' ? styles.active : ''}`}>
          <button onClick={() => changeSection('distribution')}>Distribution</button>
        </li>
        <li className={`${styles.listItem} ${section == 'performance' ? styles.active : ''}`}>
          <button onClick={() => changeSection('performance')}>Performance</button>
        </li>
        <li className={`${styles.listItem} ${section == 'volume' ? styles.active : ''}`}>
          <button onClick={() => changeSection('volume')}>Volume</button>
        </li>
        <li className={styles.listItem}>
          <span>Community stats</span>
        </li>
        <li className={`${styles.listItem} ${section == 'activity' ? styles.active : ''}`}>
          <button onClick={() => changeSection('activity')}>Activity</button>
        </li>
        <li className={`${styles.listItem} ${section == 'contribution' ? styles.active : ''}`}>
          <button onClick={() => changeSection('contribution')}>Contribution</button>
        </li>
        <li className={styles.subsets}>
          <span>Subset switcher</span>
          <ul>
            <li><button onClick={() => switchSubset('weekly')} className={activeSubset == 'weekly' ? styles.active : ''}>7 days</button></li>
            <li><button onClick={() => switchSubset('monthly')} className={activeSubset == 'monthly' ? styles.active : ''}>30 days</button></li>
            <li><button onClick={() => switchSubset('quarterly')} className={activeSubset == 'quarterly' ? styles.active : ''}>Quarter</button></li>
            <li><button onClick={() => switchSubset('yearly')} className={activeSubset == 'yearly' ? styles.active : ''}>Year</button></li>
            <li><button onClick={() => switchSubset('all')} className={activeSubset == 'all' ? styles.active : ''}>All</button></li>
          </ul>
        </li>
      </ul>
      <div className={styles.statistics} id='stats'>
        {section == 'overview' && <Overview subset={subset} activeSubset={activeSubset} />}
        {section == 'distribution' && <Distribution subset={subset} activeSubset={activeSubset} />}
        {section == 'performance' && <Performance subset={subset} activeSubset={activeSubset} />}
        {section == 'volume' && <Volume subset={subset} activeSubset={activeSubset} />}
        {section == 'activity' && <Activity subset={subset} activeSubset={activeSubset} />}
        {section == 'contribution' && <Contribution subset={subset} activeSubset={activeSubset} />}
      </div>
    </div>
  )
}

export default StatsTool
