import React from 'react'
import PackageIcon from 'part:@sanity/base/package-icon'
import {useId} from '@reach/auto-id'
import CurrentVersionsDialog from './CurrentVersionsDialog'
import UpdateNotifierDialog from './UpdateNotifierDialog'
import {Package, Severity} from './types'

import styles from './SanityStatus.css'

interface Props {
  isSupported: boolean
  isUpToDate: boolean
  level: Severity
  onHideDialog: () => void
  onShowDialog: () => void
  outdated: Package[]
  showDialog: boolean
  versions: {[key: string]: string}
}

function formatUpdateLabel(len: number) {
  if (len === 1) return ' 1 update'
  return `${len} updates`
}

export default function SanityStatus(props: Props) {
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
  const currentLevel: Severity = outdated.length ? level : 'notice'
  const severity: Severity = isSupported ? currentLevel : 'high'

  return (
    <div className={styles.root}>
      {showDialog && (
        <div role="dialog" aria-modal="true" aria-labelledby={elementId}>
          {isUpToDate ? (
            <CurrentVersionsDialog onClose={onHideDialog} versions={versions} />
          ) : (
            <UpdateNotifierDialog onClose={onHideDialog} outdated={outdated} severity={severity} />
          )}
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
