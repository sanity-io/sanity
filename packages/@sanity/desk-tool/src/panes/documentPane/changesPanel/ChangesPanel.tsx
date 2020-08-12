/* eslint-disable max-depth */
import React, {useCallback, Fragment, useContext} from 'react'
import {useDocumentOperation} from '@sanity/react-hooks'
import {Diff} from '@sanity/diff'
import {FallbackDiff} from '../../../diffs/_fallback/FallbackDiff'
import {resolveDiffComponent} from '../../../diffs/resolveDiffComponent'
import {Annotation} from '../history/types'
import {SchemaType} from '../types'
import {buildChangeList} from './buildChangeList'
import {OperationsAPI, ChangeNode, ArrayChangeNode, FieldChangeNode, GroupChangeNode} from './types'
import {undoChange} from './undoChange'
import styles from './ChangesPanel.css'
import {DiffErrorBoundary} from './DiffErrorBoundary'

type Props = {
  diff: Diff<Annotation>
  schemaType: SchemaType
  documentId: string
}

type DocumentContextProps = {
  documentId: string
  schemaType: SchemaType
}

const DocumentContext = React.createContext<DocumentContextProps>({} as any)

export function ChangesPanel({diff, schemaType, documentId}: Props) {
  if (diff.type !== 'object') {
    return null
  }

  const documentContext = {documentId, schemaType}
  const changes = buildChangeList(schemaType, diff)
  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <h2>Changes</h2>
      </header>

      <div className={styles.body}>
        <DocumentContext.Provider value={documentContext}>
          <div className={styles.changeList}>
            {changes.map(change => (
              <ChangeResolver change={change} key={change.key} level={0} />
            ))}
          </div>
        </DocumentContext.Provider>
      </div>
    </div>
  )
}

function ArrayChange({change, level = 0}: {change: ArrayChangeNode; level: number}) {
  const DiffComponent = resolveDiffComponent(change.schemaType) || FallbackDiff
  const {documentId, schemaType} = useContext(DocumentContext)
  const docOperations = useDocumentOperation(documentId, schemaType.name) as OperationsAPI
  const handleUndoChange = useCallback(() => undoChange(change.diff, change.path, docOperations), [
    documentId,
    change.key,
    change.diff
  ])

  return (
    <div className={styles.arrayChange}>
      <div className={styles.change__header}>
        <div className={styles.change__breadcrumb}>
          {change.titlePath.slice(level).map((titleSegment, idx) => (
            <Fragment key={idx}>
              {idx > 0 && <> › </>}
              <strong>{titleSegment}</strong>
            </Fragment>
          ))}
        </div>

        <button type="button" className={styles.change__revertButton} onClick={handleUndoChange}>
          Revert changes
        </button>
      </div>

      <DiffErrorBoundary>
        <DiffComponent diff={change.diff} schemaType={change.schemaType} items={change.items} />
      </DiffErrorBoundary>
    </div>
  )
}

function FieldChange({change, level = 0}: {change: FieldChangeNode; level: number}) {
  const DiffComponent = resolveDiffComponent(change.schemaType) || FallbackDiff
  const {documentId, schemaType} = useContext(DocumentContext)
  const docOperations = useDocumentOperation(documentId, schemaType.name) as OperationsAPI
  const handleUndoChange = useCallback(() => undoChange(change.diff, change.path, docOperations), [
    documentId,
    change.key,
    change.diff
  ])

  return (
    <div className={styles.fieldChange}>
      <div className={styles.change__header}>
        <div className={styles.change__breadcrumb}>
          {change.titlePath.slice(level).map((titleSegment, idx) => (
            <Fragment key={idx}>
              {idx > 0 && <> › </>}
              <strong>{titleSegment}</strong>
            </Fragment>
          ))}
        </div>

        <button type="button" className={styles.change__revertButton} onClick={handleUndoChange}>
          Revert changes
        </button>
      </div>

      <DiffErrorBoundary>
        <DiffComponent diff={change.diff} schemaType={change.schemaType} />
      </DiffErrorBoundary>
    </div>
  )
}

function GroupChange({change: group}: {change: GroupChangeNode}) {
  const {titlePath, changes} = group
  return (
    <div className={styles.groupChange}>
      <div className={styles.change__header}>
        <div className={styles.change__breadcrumb}>
          {titlePath.map((titleSegment, idx) => (
            <Fragment key={idx}>
              {idx > 0 && <> › </>}
              <strong>{titleSegment}</strong>
            </Fragment>
          ))}
        </div>

        <button type="button" className={styles.change__revertButton}>
          Revert changes
        </button>
      </div>

      <div className={styles.changeList}>
        {changes.map(change => (
          <ChangeResolver key={change.key} change={change} level={change.titlePath.length - 1} />
        ))}
      </div>
    </div>
  )
}

function ChangeResolver({change, level = 0}: {change: ChangeNode; level: number}) {
  if (change.type === 'array') {
    return <ArrayChange change={change} level={level} />
  }

  if (change.type === 'field') {
    return <FieldChange change={change} level={level} />
  }

  if (change.type === 'group') {
    return <GroupChange change={change} />
  }

  return <div>Unknown change type: {(change as any).type}</div>
}
