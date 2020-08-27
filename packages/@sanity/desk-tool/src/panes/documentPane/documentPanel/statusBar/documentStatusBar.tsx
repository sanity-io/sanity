/* eslint-disable @typescript-eslint/explicit-function-return-type */

import React from 'react'
import TimeAgo from '../../../../components/TimeAgo'
import {useDocumentHistory} from '../../documentHistory'
import styles from './documentStatusBar.css'
import {DocumentStatusBarActions} from './documentStatusBarActions'
import {DocumentStatusBarBadges} from './documentStatusBarBadges'
import {SyncState} from './syncState'

interface Props {
  id: string
  type: string
  lastUpdated?: string
}

export function DocumentStatusBar(props: Props) {
  const {open: openHistory} = useDocumentHistory()

  return (
    <div className={styles.root}>
      <div className={styles.status}>
        <div className={styles.statusBadgesContainer}>
          <DocumentStatusBarBadges id={props.id} type={props.type} />
        </div>
        <div className={styles.statusDetails}>
          <button className={styles.lastUpdatedButton} onClick={openHistory} type="button">
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
