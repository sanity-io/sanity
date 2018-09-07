import React from 'react'
import PropTypes from 'prop-types'
import generateHelpUrl from '@sanity/generate-help-url'
import {SerializeError} from '@sanity/structure'
import ErrorIcon from 'part:@sanity/base/error-icon'
import styles from './styles/StructureError.css'

function formatStack(stack) {
  return (
    stack
      // Prettify builder functions
      .replace(/\(\.\.\.\)\./g, '(...)\n  .')
      // Remove webpack cruft from function names
      .replace(/__WEBPACK_IMPORTED_MODULE_\d+_+/g, '')
      // Remove default export postfix from function names
      .replace(/___default\./g, '.')
      // Replace full host path, leave only path to JS-file
      .replace(new RegExp(` \\(https?:\\/\\/${window.location.host}`, 'g'), ' (')
  )
}

export default function StructureError(props) {
  const {path, helpId, message, stack} = props.error

  // Serialize errors are well-formatted and should be readable, in these cases a stack trace is
  // usually not helpful. Build errors in dev (with HMR) usually also contains a bunch of garbage
  // instead of an actual error message, so make sure we show the message in these cases as well
  const showStack =
    !(props.error instanceof SerializeError) && !message.includes('Module build failed:')

  return (
    <div className={styles.root}>
      <h2 className={styles.title}>Hmm… encountered an error while reading structure</h2>

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
            <div className={styles.problemMessage}>{showStack ? formatStack(stack) : message}</div>
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
