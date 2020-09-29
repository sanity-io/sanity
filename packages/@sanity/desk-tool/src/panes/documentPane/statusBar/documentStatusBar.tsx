import React from 'react'
import {useEditState} from '@sanity/react-hooks'
import resolveDocumentBadges from 'part:@sanity/base/document-badges/resolver'
import {useDocumentHistory} from '../documentHistory'
import {DocumentStatusBarActions, HistoryStatusBarActions} from './documentStatusBarActions'
import {DocumentSparkline} from './documentSparkline'
import {DocumentStatusBarProps} from './types'
import styles from './documentStatusBar.css'

export function DocumentStatusBar(props: DocumentStatusBarProps) {
  const {historyController} = useDocumentHistory()
  const editState = useEditState(props.id, props.type)
  const badges = editState ? resolveDocumentBadges(editState) : []
  const showingRevision = historyController.onOlderRevision()
  const revision = historyController.revTime?.id || ''

  return (
    <div className={styles.root}>
      <DocumentSparkline editState={editState} badges={badges} lastUpdated={props.lastUpdated} />
      <div className={styles.actions}>
        <div className={styles.actionsWrapper}>
          {showingRevision ? (
            <HistoryStatusBarActions id={props.id} type={props.type} revision={revision} />
          ) : (
            <DocumentStatusBarActions id={props.id} type={props.type} />
          )}
        </div>
      </div>
    </div>
  )
}
