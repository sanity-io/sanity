/* eslint-disable @typescript-eslint/explicit-function-return-type */

import React from 'react'
import TimeAgo from '../../../components/TimeAgo'
import styles from './DocumentStatusBar.css'
import {DocumentStatusBarActions} from './DocumentStatusBarActions'
import {DocumentStatusBarBadges} from './DocumentStatusBarBadges'
import {SyncState} from './SyncState'

interface Props {
  id: string
  type: string
  lastUpdated?: string
  onLastUpdatedButtonClick: () => void
}

export default function DocumentStatusBar(props: Props) {
  return (
    <div className={styles.root}>
      <div className={styles.status}>
        <div className={styles.statusBadgesContainer}>
          <DocumentStatusBarBadges id={props.id} type={props.type} />
        </div>
        <div className={styles.statusDetails}>
          <button
            className={styles.lastUpdatedButton}
            onClick={props.onLastUpdatedButtonClick}
            type="button"
          >
            {props.lastUpdated ? (
              <>
                Updated <TimeAgo time={props.lastUpdated} />
              </>
            ) : (
              'Empty'
            )}
          </button>
          <SyncState id={props.id} type={props.type} />
        </div>
      </div>
      <div className={styles.actions}>
        <div className={styles.actionsWrapper}>
          <DocumentStatusBarActions id={props.id} type={props.type} />
        </div>
      </div>
    </div>
  )
}
