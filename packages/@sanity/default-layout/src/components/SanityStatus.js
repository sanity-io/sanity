import PropTypes from 'prop-types'
import React from 'react'
import PackageIcon from 'part:@sanity/base/package-icon'
import {useId} from '@reach/auto-id'
import UpdateNotifierDialog from './UpdateNotifierDialog'
import CurrentVersionsDialog from './CurrentVersionsDialog'

import styles from './styles/SanityStatus.css'

function formatUpdateLabel(len) {
  if (len === 1) return ' 1 update'
  return `${len} updates`
}

export default function SanityStatus(props) {
  const {
    isSupported,
    isUpToDate,
    level,
    onHideDialog,
    onShowDialog,
    outdated,
    showDialog,
    versions
  } = props
  const elementId = useId()
  const currentLevel = outdated.length ? level : 'notice'
  const severity = isSupported ? currentLevel : 'high'
  const Dialog = isUpToDate ? CurrentVersionsDialog : UpdateNotifierDialog

  return (
    <div className={styles.root}>
      {showDialog && (
        <div role="dialog" aria-modal="true" aria-labelledby={elementId}>
          <Dialog
            severity={severity}
            outdated={outdated}
            onClose={onHideDialog}
            versions={versions}
          />
        </div>
      )}
      {!isUpToDate && (
        <button
          className={styles.button}
          onClick={onShowDialog}
          type="button"
          aria-label={`${formatUpdateLabel(outdated.length)}, ${severity} severity level.`}
          id={elementId}
        >
          <div className={styles.buttonInner} tabIndex={-1}>
            <div className={styles.hasUpdates}>
              <span className={styles.updateIcon} role="image">
                <div
                  className={styles.updateIndicator}
                  data-severity={severity}
                  aria-label={`${formatUpdateLabel(outdated.length)}, ${severity} severity level.`}
                />
                <PackageIcon />
              </span>
            </div>
          </div>
        </button>
      )}
    </div>
  )
}

SanityStatus.defaultProps = {
  outdated: []
}

SanityStatus.propTypes = {
  isUpToDate: PropTypes.bool.isRequired,
  isSupported: PropTypes.bool.isRequired,
  level: PropTypes.string.isRequired,
  onHideDialog: PropTypes.func.isRequired,
  onShowDialog: PropTypes.func.isRequired,
  outdated: PropTypes.array,
  showDialog: PropTypes.bool.isRequired,
  versions: PropTypes.any.isRequired
}
