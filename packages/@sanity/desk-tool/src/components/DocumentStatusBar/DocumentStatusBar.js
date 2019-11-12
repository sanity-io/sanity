import PropTypes from 'prop-types'
import React from 'react'
import Badge from 'part:@sanity/components/badges/default'
import CheckIcon from 'part:@sanity/base/check-icon'
import SyncIcon from 'part:@sanity/base/sync-icon'
import DocumentStatusBarActions from './DocumentStatusBarActions'

import styles from './DocumentStatusBar.css'

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
        {props.badges && props.badges.length > 0 && (
          <div className={styles.statusBadges}>
            {props.badges.map(badge => (
              <Badge key={badge.id} color={badge.color} title={badge.title}>
                {badge.label}
              </Badge>
            ))}
          </div>
        )}
        {historyStatus && (
          <div className={styles.statusDetails}>
            {historyStatus} {statusIcon}
          </div>
        )}
      </div>
      <div className={styles.actions}>
        {props.actions && (
          <DocumentStatusBarActions
            actions={props.actions}
            idPrefix={props.idPrefix}
            isDisconnected={props.isDisconnected}
          />
        )}
      </div>
    </div>
  )
}

DocumentStatusBar.propTypes = {
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      color: PropTypes.oneOf(['primary', 'success', 'danger', 'white', 'warning']),
      handleClick: PropTypes.func,
      icon: PropTypes.func,
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired
    })
  ),
  badges: PropTypes.arrayOf(
    PropTypes.shape({
      color: PropTypes.oneOf([undefined, 'success', 'warning', 'danger', 'info', 'neutral']),
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      title: PropTypes.string
    })
  ),
  historyStatus: PropTypes.node,
  idPrefix: PropTypes.string.isRequired,
  isDisconnected: PropTypes.bool,
  isHistoryAvailable: PropTypes.bool,
  isSyncing: PropTypes.bool,
  onHistoryStatusClick: PropTypes.func
}

DocumentStatusBar.defaultProps = {
  actions: undefined,
  badges: undefined,
  historyStatus: undefined,
  isDisconnected: false,
  isHistoryAvailable: false,
  isSyncing: false,
  onHistoryStatusClick: undefined
}

export default DocumentStatusBar
