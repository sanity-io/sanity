import PropTypes from 'prop-types'
import React from 'react'
import Badge from 'part:@sanity/components/badges/default'
import CheckIcon from 'part:@sanity/base/check-icon'
import SyncIcon from 'part:@sanity/base/sync-icon'
import {DocumentStatusBarActions} from './DocumentStatusBarActions'
import Button from 'part:@sanity/components/buttons/default'
import ButtonGrid from 'part:@sanity/components/buttons/button-grid'
import PopOverDialog from 'part:@sanity/components/dialogs/popover'

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
        <div className={styles.actionsWrapper}>
          <DocumentStatusBarActions id={props.id} type={props.type} />
          {props.confirmationDialog && (
            <PopOverDialog
              onClickOutside={props.confirmationDialog.handleCancel}
              placement="auto-end"
              useOverlay={false}
              hasAnimation
            >
              <>
                <div className={styles.popOverText}>{props.confirmationDialog.message}</div>
                <ButtonGrid>
                  <Button onClick={props.confirmationDialog.handleCancel} kind="simple">
                    {props.confirmationDialog.cancelText || 'Cancel'}
                  </Button>
                  <Button
                    onClick={props.confirmationDialog.handleConfirm}
                    color={props.confirmationDialog.confirmColor || 'danger'}
                  >
                    {props.confirmationDialog.confirmText || 'Confirm'}
                  </Button>
                </ButtonGrid>
              </>
            </PopOverDialog>
          )}
        </div>
      </div>
    </div>
  )
}

DocumentStatusBar.propTypes = {
  id: PropTypes.string,
  type: PropTypes.string,

  badges: PropTypes.arrayOf(
    PropTypes.shape({
      color: PropTypes.oneOf([undefined, 'success', 'warning', 'danger', 'info', 'neutral']),
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      title: PropTypes.string
    })
  ),
  confirmationDialog: PropTypes.shape({
    message: PropTypes.node.isRequired,
    handleConfirm: PropTypes.func.isRequired,
    handleCancel: PropTypes.func.isRequired,
    confirmText: PropTypes.string,
    cancelText: PropTypes.string,
    confirmColor: PropTypes.string
  }),
  historyStatus: PropTypes.node,
  isDisconnected: PropTypes.bool,
  isHistoryAvailable: PropTypes.bool,
  isSyncing: PropTypes.bool,
  onHistoryStatusClick: PropTypes.func
}

DocumentStatusBar.defaultProps = {
  badges: undefined,
  isDisconnected: false,
  isHistoryAvailable: false,
  isSyncing: false,
  onHistoryStatusClick: undefined
}

export default DocumentStatusBar
