/* eslint-disable @typescript-eslint/explicit-function-return-type */

import React from 'react'
import TimeAgo from '../../../../components/TimeAgo'
import {useDocumentHistory} from '../../documentHistory'
import styles from './documentStatusBar.css'
import {DocumentStatusBarActions} from './documentStatusBarActions'
import {DocumentStatusBarBadges} from './documentStatusBarBadges'
// import {SyncState} from './syncState'
import {useEditState} from '@sanity/react-hooks'
import resolveDocumentBadges from 'part:@sanity/base/document-badges/resolver'
import {RenderBadgeCollectionState} from 'part:@sanity/base/actions/utils'

interface Props {
  id: string
  type: string
  lastUpdated?: string
}

export function DocumentStatusBar(props: Props) {
  const {open: openHistory, historyController} = useDocumentHistory()
  const editState = useEditState(props.id, props.type)
  const badges = editState ? resolveDocumentBadges(editState) : []
  return (
    <div className={styles.root}>
      <div className={styles.status} data-historyState={historyController.selectionState}>
        <button
          className={styles.lastUpdatedButton}
          onClick={openHistory}
          type="button"
          disabled={historyController.selectionState === 'active'}
        >
          <DocumentStatusBarBadges
            editState={editState}
            badges={badges}
            disabled={historyController.selectionState === 'active'}
          />
          <div className={styles.statusDetails}>
            {/* TODO */}
            <div className={styles.lastStatus}>Todo</div>
            {props.lastUpdated ? (
              <div>
                <TimeAgo time={props.lastUpdated} />
              </div>
            ) : (
              'Empty'
            )}
          </div>
        </button>
      </div>

      <div className={styles.actions}>
        <div className={styles.actionsWrapper}>
          <DocumentStatusBarActions id={props.id} type={props.type} />
        </div>
      </div>
    </div>
  )
}
