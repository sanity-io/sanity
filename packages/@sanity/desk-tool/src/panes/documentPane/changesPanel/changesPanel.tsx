/* eslint-disable max-depth */
import React, {useCallback} from 'react'
import {ObjectDiff, ObjectSchemaType, DocumentChangeContext, ChangeList} from '@sanity/field/diff'
import Button from 'part:@sanity/components/buttons/default'
import {useDocumentHistory} from '../documentHistory'

import styles from './changesPanel.css'

interface ChangesPanelProps {
  changesSinceSelectRef: React.MutableRefObject<HTMLDivElement | null>
  documentId: string
  onTimelineOpen: (mode: 'version' | 'changesSince') => void
  schemaType: ObjectSchemaType
}

export function ChangesPanel({
  changesSinceSelectRef,
  documentId,
  onTimelineOpen,
  schemaType
}: ChangesPanelProps) {
  const {closeHistory, timeline} = useDocumentHistory()
  const diff: ObjectDiff = timeline.currentDiff() as any

  if (diff.type !== 'object') {
    return null
  }

  const documentContext = React.useMemo(() => ({documentId, schemaType}), [documentId, schemaType])
  const handleMenuOpen = useCallback(() => {
    onTimelineOpen('changesSince')
  }, [onTimelineOpen])

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.mainNav}>
          <h2 className={styles.title}>Changes</h2>
          <div className={styles.closeButtonContainer}>
            <button onClick={closeHistory} type="button">
              Close
            </button>
          </div>
        </div>
        <div>
          <div className={styles.versionSelectContainer}>
            <div ref={changesSinceSelectRef} style={{display: 'inline-block'}}>
              <Button kind="simple" onClick={handleMenuOpen} padding="small">
                Since last published &darr;
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className={styles.body}>
        <DocumentChangeContext.Provider value={documentContext}>
          <div className={styles.changeList}>
            <ChangeList diff={diff} schemaType={schemaType} />
          </div>
        </DocumentChangeContext.Provider>
      </div>
    </div>
  )
}
