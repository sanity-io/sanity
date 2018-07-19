import React from 'react'
import PropTypes from 'prop-types'
import generateHelpUrl from '@sanity/generate-help-url'
import {SerializeError} from '@sanity/structure'
import ErrorIcon from 'part:@sanity/base/error-icon'
import styles from './styles/StructureError.css'

export default function StructureError(props) {
  const {path, helpId, message, stack} = props.error
  const showStack = !(props.error instanceof SerializeError)
  return (
    <div className={styles.root}>
      <h2 className={styles.title}>Uh oh… encountered an error while reading structure</h2>

      <div className={styles.body}>
        <h2 className={styles.path}>
          {path &&
            path.map((segment, i) => (
              <span key={i} className={styles.segment}>
                <span className={styles.pathSegmentProperty}>{segment}</span>
              </span>
            ))}
        </h2>
        <div className={styles.problem}>
          <div className={styles.problemSeverity}>
            <span className={styles.problemSeverityIcon}>
              <ErrorIcon />
            </span>
            <span className={styles.problemSeverityText}>Error</span>
          </div>
          <div className={styles.problemContent}>
            <div className={styles.problemMessage}>{showStack ? stack : message}</div>
            {helpId && (
              <a
                className={styles.problemLink}
                href={generateHelpUrl(helpId)}
                rel="noopener noreferrer"
                target="_blank"
              >
                View documentation
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

StructureError.propTypes = {
  error: PropTypes.shape({
    message: PropTypes.string.isRequired,
    stack: PropTypes.string.isRequired,
    path: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
    helpId: PropTypes.string
  }).isRequired
}
