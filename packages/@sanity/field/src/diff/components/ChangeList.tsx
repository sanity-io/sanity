import * as React from 'react'
import {useDocumentOperation} from '@sanity/react-hooks'
import UndoIcon from 'part:@sanity/base/undo-icon'
import Button from 'part:@sanity/components/buttons/default'
import {ObjectDiff, ObjectSchemaType, ChangeNode, OperationsAPI} from '../../types'
import {DiffContext} from '../contexts/DiffContext'
import {buildObjectChangeList} from '../changes/buildChangeList'
import {undoChange} from '../changes/undoChange'
import {ChangeResolver} from './ChangeResolver'
import {DocumentChangeContext} from './DocumentChangeContext'
import styles from './ChangeList.css'

interface Props {
  schemaType: ObjectSchemaType
  diff: ObjectDiff
  fields?: string[]
}

export function ChangeList({diff, fields, schemaType}: Props): React.ReactElement | null {
  const {documentId} = React.useContext(DocumentChangeContext)
  const docOperations = useDocumentOperation(documentId, schemaType.name) as OperationsAPI
  const {path} = React.useContext(DiffContext)

  if (schemaType.jsonType !== 'object') {
    throw new Error(`Only object schema types are allowed in ChangeList`)
  }

  const allChanges = React.useMemo(() => buildObjectChangeList(schemaType, diff, path, fields), [
    schemaType,
    fields,
    path,
    diff
  ])

  const changes = fields && fields.length === 0 ? [] : maybeFlatten(allChanges)

  const rootChange = allChanges[0]
  const handleRevertAllChanges = React.useCallback(
    () => undoChange(rootChange, diff, docOperations),
    [rootChange, diff, docOperations]
  )

  if (changes.length === 0) {
    return null
  }

  return (
    <>
      {changes.map(change => (
        <ChangeResolver change={change} key={change.key} />
      ))}

      {path.length === 0 && changes.length > 1 && (
        <div className={styles.revertAllContainer}>
          <Button icon={UndoIcon} kind="secondary" onClick={handleRevertAllChanges}>
            Revert all changes
          </Button>
        </div>
      )}
    </>
  )
}

function maybeFlatten(changes: ChangeNode[]) {
  return changes.length === 1 && changes[0].type === 'group' && changes[0].path.length === 0
    ? changes[0].changes
    : changes
}
