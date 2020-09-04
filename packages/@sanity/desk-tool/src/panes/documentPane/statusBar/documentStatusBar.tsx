/* eslint-disable @typescript-eslint/explicit-function-return-type */

import React from 'react'
import {useDocumentHistory} from '../documentHistory'
import styles from './documentStatusBar.css'
import {DocumentStatusBarActions} from './documentStatusBarActions'
import {DocumentStatusBarSparkline} from './documentStatusBarSparkline'
import {useEditState} from '@sanity/react-hooks'
import resolveDocumentBadges from 'part:@sanity/base/document-badges/resolver'

interface Props {
  id: string
  type: string
  lastUpdated?: string | null
}

export function DocumentStatusBar(props: Props) {
  const {open: openHistory, historyController} = useDocumentHistory()
  const editState = useEditState(props.id, props.type)
  const badges = editState ? resolveDocumentBadges(editState) : []
  return (
    <div className={styles.root}>
      <div className={styles.status} data-history-state={historyController.selectionState}>
        <button
          className={styles.lastUpdatedButton}
          onClick={openHistory}
          type="button"
          disabled={historyController.changesPanelActive()}
        >
          <DocumentStatusBarSparkline
            editState={editState}
            badges={badges}
            disabled={historyController.changesPanelActive()}
          />
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
