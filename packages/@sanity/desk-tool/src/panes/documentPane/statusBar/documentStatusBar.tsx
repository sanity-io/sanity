import React from 'react'
import {useEditState} from '@sanity/react-hooks'
import resolveDocumentBadges from 'part:@sanity/base/document-badges/resolver'
import Button from 'part:@sanity/components/buttons/default'
import {useDocumentHistory} from '../documentHistory'
import styles from './documentStatusBar.css'
import {DocumentStatusBarActions, HistoryStatusBarActions} from './documentStatusBarActions'
import {DocumentStatusBarSparkline} from './documentStatusBarSparkline'

interface Props {
  id: string
  type: string
  lastUpdated?: string | null
}

export function DocumentStatusBar(props: Props) {
  const {open: openHistory, historyController} = useDocumentHistory()
  const editState = useEditState(props.id, props.type)
  const badges = editState ? resolveDocumentBadges(editState) : []
  const showingRevision = historyController.onOlderRevision()
  const changePanelActive = historyController.changesPanelActive()
  const revision = historyController.revTime?.id || ''

  return (
    <div className={styles.root}>
      <div className={styles.status}>
        <Button
          kind="simple"
          padding="small"
          size="small"
          onClick={openHistory}
          type="button"
          disabled={showingRevision || changePanelActive}
        >
          <DocumentStatusBarSparkline
            editState={editState}
            badges={badges}
            disabled={showingRevision || changePanelActive}
            lastUpdated={props.lastUpdated}
          />
        </Button>
      </div>

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
