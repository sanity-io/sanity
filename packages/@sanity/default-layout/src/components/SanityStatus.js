import PropTypes from 'prop-types'
import React from 'react'
import PackageIcon from 'part:@sanity/base/package-icon'
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
  const currentLevel = outdated.length ? level : 'notice'
  const severity = isSupported ? currentLevel : 'high'
  const className = `${styles.root} ${styles[severity]}`
  const Dialog = isUpToDate ? CurrentVersionsDialog : UpdateNotifierDialog

  return (
    <div className={className}>
      {showDialog && (
        <Dialog
          severity={severity}
          outdated={outdated}
          onClose={onHideDialog}
          versions={versions}
        />
      )}
      <button className={styles.button} onClick={onShowDialog} type="button">
        <div className={styles.buttonInner} tabIndex={-1}>
          {isUpToDate ? (
            <span>Up to date</span>
          ) : (
            <span>
              <PackageIcon /> {formatUpdateLabel(outdated.length)}
            </span>
          )}
        </div>
      </button>
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
