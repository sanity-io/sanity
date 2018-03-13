import React from 'react'
import styles from './styles/SchemaErrors.css'
import ErrorIcon from 'part:@sanity/base/error-icon'
import WarningIcon from 'part:@sanity/base/warning-icon'
import generateHelpUrl from '@sanity/generate-help-url'

function renderPath(path) {
  return path.map(segment => {
    if (segment.kind === 'type') {
      return (
        <span className={styles.segment}>
          <span key="name" className={styles.pathSegmentTypeName}>{segment.name}</span>
          &ensp;<span key="type" className={styles.pathSegmentTypeType}>{segment.type}</span>
        </span>
      )
    }
    if (segment.kind === 'property') {
      return (
        <span className={styles.segment}>
          <span className={styles.pathSegmentProperty}>{segment.name}</span>
        </span>
      )
    }
    if (segment.kind === 'type') {
      return (
        <span className={styles.segment}>
          <span key="name" className={styles.pathSegmentTypeName}>{segment.name}</span>
          <span key="type" className={styles.pathSegmentTypeType}>{segment.type}</span>
        </span>
      )
    }
    return null
  })
    .filter(Boolean)
}


export function SchemaErrors(props) {
  const {problemGroups} = props
  return (
    <div className={styles.root}>
      <h2 className={styles.title}>Uh oh… found errors in schema</h2>
      <ul className={styles.list}>
        {problemGroups.map((group, i) => {
          return (
            <li key={i} className={styles.listItem}>
              <h2 className={styles.path}>
                {renderPath(group.path)}
              </h2>
              <ul className={styles.problems}>
                {group.problems.map((problem, j) => (
                  <li key={j} className={styles[`problem_${problem.severity}`]}>
                    <div className={styles.problemSeverity}>
                      <span className={styles.problemSeverityIcon}>
                        {problem.severity === 'error' && <ErrorIcon />}
                        {problem.severity === 'warning' && <WarningIcon />}
                      </span>
                      <span className={styles.problemSeverityText}>
                        {problem.severity}
                      </span>
                    </div>
                    <div className={styles.problemContent}>
                      <div className={styles.problemMessage}>
                        {problem.message}
                      </div>
                      {problem.helpId && (
                        <a
                          className={styles.problemLink}
                          href={generateHelpUrl(problem.helpId)}
                          target="_blank"
                        >
                          View documentation
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </li>
          )
        })}
      </ul>
    </div>

  )
}
