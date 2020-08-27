/* eslint-disable max-depth */
import React, {useCallback} from 'react'
import {
  ObjectDiff,
  ObjectSchemaType,
  DocumentChangeContext,
  ChangeList,
  Chunk
} from '@sanity/field/diff'
import CloseIcon from 'part:@sanity/base/close-icon'
import Button from 'part:@sanity/components/buttons/default'
import {useDocumentHistory} from '../documentHistory'

import styles from './changesPanel.css'
import {format} from 'date-fns'

interface ChangesPanelProps {
  changesSinceSelectRef: React.MutableRefObject<HTMLDivElement | null>
  documentId: string
  onTimelineOpen: () => void
  schemaType: ObjectSchemaType
  loading: boolean
  since: Chunk | null
}

export function ChangesPanel({
  changesSinceSelectRef,
  documentId,
  onTimelineOpen,
  loading,
  since,
  schemaType
}: ChangesPanelProps) {
  const {close: closeHistory, timeline} = useDocumentHistory()
  const diff: ObjectDiff = timeline.currentDiff() as any

  if (!loading && diff?.type !== 'object') {
    return null
  }

  const documentContext = React.useMemo(() => ({documentId, schemaType}), [documentId, schemaType])

  // This is needed to stop the ClickOutside-handler (in the Popover) to treat the click
  // as an outside-click.
  const ignoreClickOutside = useCallback((evt: React.MouseEvent<HTMLDivElement>) => {
    evt.stopPropagation()
  }, [])

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.mainNav}>
          <h2 className={styles.title}>Changes</h2>
          <div className={styles.closeButtonContainer}>
            <Button
              icon={CloseIcon}
              kind="simple"
              onClick={closeHistory}
              padding="small"
              title="Hide changes panel"
              type="button"
            />
          </div>
        </div>
        <div>
          <div className={styles.versionSelectContainer}>
            <div ref={changesSinceSelectRef} style={{display: 'inline-block'}}>
              <Button
                kind="simple"
                onMouseUp={ignoreClickOutside}
                onClick={onTimelineOpen}
                padding="small"
              >
                {sinceText(since)} &darr;
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className={styles.body}>
        {loading ? (
          <div>Loading…</div>
        ) : (
          <DocumentChangeContext.Provider value={documentContext}>
            <div className={styles.changeList}>
              <ChangeList diff={diff} schemaType={schemaType} />
            </div>
          </DocumentChangeContext.Provider>
        )}
      </div>
    </div>
  )
}

function sinceText(since: Chunk | null) {
  if (!since) return 'Since unknown version'

  if (since.type === 'publish') {
    return `Since version published at ${format(since.endTimestamp)}`
  }

  return `Since version at ${format(since.endTimestamp)}`
}
