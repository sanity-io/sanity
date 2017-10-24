import React from 'react'
import generateHelpUrl from '@sanity/generate-help-url'
import styles from './styles/SchemaErrors.css'

function renderPath(path) {
  return path.map(segment => {
    if (segment.kind === 'type') {
      return [
        <span key="name" className={styles.pathSegmentTypeName}>{segment.name}</span>,
        <span key="type" className={styles.pathSegmentTypeType}>{segment.type}</span>
      ]
    }
    if (segment.kind === 'property') {
      return <span className={styles.pathSegmentProperty}>{segment.name}</span>
    }
    if (segment.kind === 'type') {
      return [
        <span key="name" className={styles.pathSegmentTypeName}>{segment.name}</span>,
        <span key="type" className={styles.pathSegmentTypeType}>{segment.type}</span>
      ]
    }
    return null
  })
    .filter(Boolean)
    .map(segment => ([
      <span key="arrow" style={{paddingLeft: 2, paddingRight: 2}}>&raquo;</span>,
      segment
    ]))
}

const SEVERITY_SYMBOLS = {
  error: '🚫',
  warning: '⚠️'
}

export function SchemaErrors(props) {
  const {problemGroups} = props
  return (
    <ul className={styles.list}>
      {problemGroups.map((group, i) => {
        return (
          <li key={i} className={styles.listItem}>
            At {renderPath(group.path)}
            {group.problems.map((problem, j) => (
              <div key={j}>
                {SEVERITY_SYMBOLS[problem.severity]} {problem.message} {problem.helpId && (<a href={generateHelpUrl(problem.helpId)}>Read more</a>)}
              </div>
            ))}
          </li>
        )
      })}
    </ul>
  )
}
