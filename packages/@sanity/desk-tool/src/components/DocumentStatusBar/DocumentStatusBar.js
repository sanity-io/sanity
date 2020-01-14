import PropTypes from 'prop-types'
import React from 'react'
import CheckIcon from 'part:@sanity/base/check-icon'
import SyncIcon from 'part:@sanity/base/sync-icon'
import styles from './DocumentStatusBar.css'
import {DocumentStatusBarActions} from './DocumentStatusBarActions'
import {DocumentStatusBarBadges} from './DocumentStatusBarBadges'

// eslint-disable-next-line complexity
function DocumentStatusBar(props) {
  const handleHistoryButtonClick = event => {
    if (typeof props.onHistoryStatusClick === 'function') {
      props.onHistoryStatusClick(event)
    }
  }

  let className = styles.root
  if (props.isDisconnected) {
    className = styles.isDisconnected
  } else if (props.isSyncing) {
    className = styles.isSyncing
  }

  let statusIcon = null
  if (props.isSyncing || props.isDisconnected) {
    statusIcon = (
      <span className={styles.rotatingStatusIcon}>
        <SyncIcon />
      </span>
    )
  } else {
    statusIcon = (
      <span className={styles.statusIcon}>
        <CheckIcon />
      </span>
    )
  }

  let historyStatus = null
  if (props.historyStatus && props.isHistoryAvailable) {
    historyStatus = (
      <button
        className={styles.historyButton}
        // eslint-disable-next-line react/jsx-no-bind
        onClick={handleHistoryButtonClick}
        type="button"
      >
        {props.historyStatus}
      </button>
    )
  } else if (props.historyStatus) {
    historyStatus = <span className={styles.historyLabel}>{props.historyStatus}</span>
  }

  return (
    <div className={className}>
      <div className={styles.status}>
        <DocumentStatusBarBadges id={props.id} type={props.type} />
        {historyStatus && (
          <div className={styles.statusDetails}>
            {historyStatus} {statusIcon}
          </div>
        )}
      </div>
      <div className={styles.actions}>
        <div className={styles.actionsWrapper}>
          <DocumentStatusBarActions id={props.id} type={props.type} />
        </div>
      </div>
    </div>
  )
}

DocumentStatusBar.propTypes = {
  id: PropTypes.string,
  type: PropTypes.string,
  historyStatus: PropTypes.node,
  isDisconnected: PropTypes.bool,
  isHistoryAvailable: PropTypes.bool,
  isSyncing: PropTypes.bool,
  onHistoryStatusClick: PropTypes.func
}

DocumentStatusBar.defaultProps = {
  isDisconnected: false,
  isHistoryAvailable: false,
  isSyncing: false,
  onHistoryStatusClick: undefined
}

export default DocumentStatusBar
