/* eslint-disable max-depth */
import React, {useCallback, Fragment, useContext} from 'react'
import {useDocumentOperation} from '@sanity/react-hooks'
import {ObjectDiff, SchemaType, ObjectSchemaType} from '@sanity/field/diff'
import {FallbackDiff} from '../../../diffs/_fallback/FallbackDiff'
import {resolveDiffComponent} from '../../../diffs/resolveDiffComponent'
import {useDocumentHistory} from '../documentHistory'
import {buildDocumentChangeList} from './buildChangeList'
import {DiffErrorBoundary} from './diffErrorBoundary'
import {
  OperationsAPI,
  ChangeNode,
  FieldChangeNode,
  GroupChangeNode,
  FromToIndex,
  ChangeTitlePath
} from './types'
import {undoChange} from './undoChange'

import styles from './changesPanel.css'

interface ChangesPanelProps {
  documentId: string
  schemaType: ObjectSchemaType
}

type DocumentContextProps = {
  documentId: string
  schemaType: SchemaType
}

const DocumentContext = React.createContext<DocumentContextProps>({} as any)

export function ChangesPanel({documentId, schemaType}: ChangesPanelProps) {
  const {closeHistory, timeline} = useDocumentHistory()
  const diff: ObjectDiff = timeline.currentDiff() as any

  if (diff.type !== 'object') {
    return null
  }

  const documentContext = {documentId, schemaType}
  const changes = buildDocumentChangeList(schemaType, diff)

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
          <div style={{display: 'inline-block', border: '1px solid #ccc'}}>
            Since last published &darr;
          </div>
        </div>
      </header>

      <div className={styles.body}>
        <DocumentContext.Provider value={documentContext}>
          <div className={styles.changeList}>
            {changes.map(change => (
              <ChangeResolver change={change} key={change.key} />
            ))}
          </div>
        </DocumentContext.Provider>
      </div>
    </div>
  )
}

function ChangeHeader({change, titlePath}: {change: FieldChangeNode; titlePath: ChangeTitlePath}) {
  const {documentId, schemaType} = useContext(DocumentContext)
  const docOperations = useDocumentOperation(documentId, schemaType.name) as OperationsAPI
  const handleUndoChange = useCallback(() => undoChange(change.diff, change.path, docOperations), [
    documentId,
    change.key,
    change.diff
  ])

  return (
    <div className={styles.change__header}>
      <ChangeBreadcrumb titlePath={titlePath} />

      <button type="button" className={styles.change__revertButton} onClick={handleUndoChange}>
        Revert changes
      </button>
    </div>
  )
}

function FieldChange({change}: {change: FieldChangeNode}) {
  const DiffComponent = resolveDiffComponent(change.schemaType) || FallbackDiff

  return (
    <div className={styles.fieldChange}>
      <ChangeHeader change={change} titlePath={change.titlePath} />

      <div className={styles.diffComponent}>
        <DiffErrorBoundary>
          <DiffComponent diff={change.diff} schemaType={change.schemaType} />
        </DiffErrorBoundary>
      </div>
    </div>
  )
}

function GroupChange({change: group}: {change: GroupChangeNode}) {
  const {titlePath, changes} = group
  return (
    <div className={styles.groupChange}>
      <div className={styles.change__header}>
        <ChangeBreadcrumb titlePath={titlePath} />

        <button type="button" className={styles.change__revertButton}>
          Revert changes
        </button>
      </div>

      <div className={styles.changeList}>
        {changes.map(change => (
          <ChangeResolver key={change.key} change={change} />
        ))}
      </div>
    </div>
  )
}

function ChangeResolver({change}: {change: ChangeNode}) {
  if (change.type === 'field') {
    return <FieldChange change={change} />
  }

  if (change.type === 'group') {
    return <GroupChange change={change} />
  }

  return <div>Unknown change type: {(change as any).type}</div>
}

function ChangeBreadcrumb({titlePath}: {titlePath: ChangeTitlePath}) {
  return (
    <div className={styles.change__breadcrumb}>
      {titlePath.map((titleSegment, idx) => (
        <Fragment key={idx}>
          {idx > 0 && typeof titleSegment === 'string' && (
            <em className={styles.change__breadcrumb__separator}> / </em>
          )}
          <TitleSegment segment={titleSegment} />
        </Fragment>
      ))}
    </div>
  )
}

function TitleSegment({segment}: {segment: string | FromToIndex}) {
  if (typeof segment === 'string') {
    return (
      <strong className={styles.change__breadcrumb__segment} title={segment}>
        {segment}
      </strong>
    )
  }

  const {hasMoved, fromIndex, toIndex} = segment
  return (
    <span className={styles.change__breadcrumb__index_group}>
      {hasMoved && <span className={styles.change__breadcrumb__index}>{fromIndex}</span>}
      {hasMoved && ' → '}
      <span className={styles.change__breadcrumb__index}>{toIndex}</span>
    </span>
  )
}
