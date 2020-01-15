import PropTypes from 'prop-types'
import React from 'react'
import styles from './DocumentStatusBar.css'
import {DocumentStatusBarActions} from './DocumentStatusBarActions'
import {DocumentStatusBarBadges} from './DocumentStatusBarBadges'
import {SyncState} from './SyncState'

function DocumentStatusBar(props) {
  let historyStatus: any = null
  if (props.historyStatus && props.isHistoryAvailable) {
    historyStatus = (
      <button className={styles.historyButton} onClick={props.onHistoryStatusClick} type="button">
        {props.historyStatus}
      </button>
    )
  } else if (props.historyStatus) {
    historyStatus = <span className={styles.historyLabel}>{props.historyStatus}</span>
  }

  return (
    <div className={styles.root}>
      <div className={styles.status}>
        <DocumentStatusBarBadges id={props.id} type={props.type} />
        {historyStatus && (
          <div className={styles.statusDetails}>
            {historyStatus} <SyncState id={props.id} type={props.type} />
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
  isHistoryAvailable: PropTypes.bool,
  onHistoryStatusClick: PropTypes.func
}

DocumentStatusBar.defaultProps = {
  isHistoryAvailable: false,
  onHistoryStatusClick: undefined
}

export default DocumentStatusBar
