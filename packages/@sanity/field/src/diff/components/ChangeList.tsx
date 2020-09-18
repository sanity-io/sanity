import * as React from 'react'
import {Path} from '@sanity/types'
import {useDocumentOperation} from '@sanity/react-hooks'
import UndoIcon from 'part:@sanity/base/undo-icon'
import Button from 'part:@sanity/components/buttons/default'
import {ObjectDiff, ObjectSchemaType, ChangeNode, OperationsAPI} from '../../types'
import {DiffContext} from '../contexts/DiffContext'
import {buildObjectChangeList} from '../changes/buildChangeList'
import {undoChange} from '../changes/undoChange'
import {ChangeResolver} from './ChangeResolver'
import {DocumentChangeContext} from './DocumentChangeContext'

interface Props {
  schemaType: ObjectSchemaType
  diff: ObjectDiff
  fields?: string[]
}

export function ChangeList({diff, fields, schemaType}: Props): React.ReactElement | null {
  const {documentId} = React.useContext(DocumentChangeContext)
  const docOperations = useDocumentOperation(documentId, schemaType.name) as OperationsAPI
  const {path} = React.useContext(DiffContext)
  const allChanges = buildObjectChangeList(schemaType, diff, path, [])

  const handleRevertAllChanges = React.useCallback(
    () => undoChange(allChanges[0], diff, docOperations),
    [allChanges[0], diff, docOperations]
  )

  if (schemaType.jsonType !== 'object') {
    throw new Error(`Only object schema types are allowed in ChangeList`)
  }

  const changes = React.useMemo(() => getFlatChangeList(schemaType, diff, path, fields), [
    schemaType,
    fields,
    path,
    diff
  ])

  if (changes.length === 0) {
    return null
  }
  // @todo move?
  const revertAllChangesContainerStyle = {display: 'grid', marginTop: '1rem'}

  return (
    <>
      {changes.map(change => (
        <ChangeResolver change={change} key={change.key} />
      ))}
      {changes.length > 1 && (
        <div style={revertAllChangesContainerStyle}>
          <Button icon={UndoIcon} kind="secondary" onClick={handleRevertAllChanges}>
            Revert all changes
          </Button>
        </div>
      )}
    </>
  )
}

function getFlatChangeList(
  schemaType: ObjectSchemaType,
  diff: ObjectDiff,
  path: Path,
  fields?: string[]
) {
  if (fields && fields.length === 0) {
    return []
  }

  return maybeFlatten(buildObjectChangeList(schemaType, diff, path, [], {fieldFilter: fields}))
}

function maybeFlatten(changes: ChangeNode[]) {
  return changes.length === 1 && changes[0].type === 'group' && changes[0].path.length === 0
    ? changes[0].changes
    : changes
}
