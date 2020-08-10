/* eslint-disable max-depth */
import React, {useCallback, Fragment, useContext} from 'react'
import {diffItem} from 'sanity-diff-patch'
import {useDocumentOperation} from '@sanity/react-hooks'
import {Diff, NoDiff, Path} from '@sanity/diff'
import {toString as pathToString} from '@sanity/util/paths'
import {FallbackDiff} from '../../../diffs/FallbackDiff'
import {resolveDiffComponent} from '../../../diffs/resolveDiffComponent'
import {Annotation} from '../history/types'
import {SchemaType, ChangeNode, FieldChangeNode, GroupChangeNode} from '../types'
import {buildChangeList} from './buildChangeList'
import {InsertPatch, UnsetPatch, SetPatch, OperationsAPI} from './types'
import styles from './ChangesPanel.css'

type Props = {
  diff: Diff<Annotation> | NoDiff | null
  schemaType: SchemaType
  documentId: string
}

type DocumentContextProps = {
  documentId: string
  schemaType: SchemaType
}

const DocumentContext = React.createContext<DocumentContextProps>({} as any)

export function ChangesPanel({diff, schemaType, documentId}: Props) {
  if (!diff || diff.type !== 'object') {
    return null
  }

  const documentContext = {documentId, schemaType}
  const changes = buildChangeList(schemaType, diff, [], [])
  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <h2>Changes</h2>
      </header>

      <div style={{padding: '1em'}}>
        <div className={styles.changeList}>
          <DocumentContext.Provider value={documentContext}>
            {changes.map(change => (
              <ChangeResolver change={change} key={change.key} level={0} />
            ))}
          </DocumentContext.Provider>
        </div>
      </div>
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

      <DiffComponent diff={change.diff} schemaType={change.schemaType} />
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
  return change.type === 'field' ? (
    <FieldChange change={change} level={level} />
  ) : (
    <GroupChange change={change} />
  )
}

function undoChange(diff: Diff, path: Path, documentOperations: OperationsAPI) {
  const patches = diffItem(diff.toValue, diff.fromValue, {diffMatchPatch: {enabled: false}}, path)

  const inserts = patches
    .filter((patch): patch is InsertPatch => patch.op === 'insert')
    .map(({after, items}) => ({insert: {after, items}}))

  const unsets = patches
    .filter((patch): patch is UnsetPatch => patch.op === 'unset')
    .reduce((acc, patch) => acc.concat(pathToString(patch.path)), [] as string[])

  let hasSets = false
  const sets = patches
    .filter((patch): patch is SetPatch => patch.op === 'set')
    .reduce((acc, patch) => {
      hasSets = true
      acc[pathToString(patch.path)] = patch.value
      return acc
    }, {} as Record<string, unknown>)

  return documentOperations.patch.execute([
    ...inserts,
    ...(unsets.length > 0 ? [{unset: unsets}] : []),
    ...(hasSets ? [{set: sets}] : [])
  ])
}
