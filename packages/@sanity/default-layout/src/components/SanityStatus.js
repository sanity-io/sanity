import PropTypes from 'prop-types'
import React from 'react'
import SanityLogo from 'part:@sanity/base/sanity-logo'
import UpdateNotifierDialog from './UpdateNotifierDialog'
import CurrentVersionsDialog from './CurrentVersionsDialog'

import styles from './styles/SanityStatus.css'

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
  const severity = isSupported ? level : 'high'
  const Dialog = isUpToDate ? CurrentVersionsDialog : UpdateNotifierDialog

  let status

  switch (true) {
    case isUpToDate:
      status = <span />
      break
    case !isUpToDate:
      status = <span>Not updated</span>
      break
    default:
      break
  }

  return (
    <div className={styles.root}>
      {showDialog && (
        <Dialog
          severity={severity}
          outdated={outdated}
          onClose={onHideDialog}
          versions={versions}
        />
      )}
      <button onClick={onShowDialog} type="button">
        <SanityLogo /> {status}
      </button>
    </div>
  )
}

SanityStatus.propTypes = {
  isUpToDate: PropTypes.bool.isRequired,
  isSupported: PropTypes.bool.isRequired,
  level: PropTypes.string.isRequired,
  onHideDialog: PropTypes.func.isRequired,
  onShowDialog: PropTypes.func.isRequired,
  showDialog: PropTypes.bool.isRequired
}
