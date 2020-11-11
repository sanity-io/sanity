import {DialogAction} from '@sanity/base/__legacy/@sanity/components'
import {useDocumentOperation} from '@sanity/react-hooks'
import UndoIcon from 'part:@sanity/base/undo-icon'
import Button from 'part:@sanity/components/buttons/default'
import PopoverDialog from 'part:@sanity/components/dialogs/popover'
import React, {useState, useCallback} from 'react'
import {ObjectDiff, ObjectSchemaType, ChangeNode, OperationsAPI} from '../../types'
import {DiffContext} from '../contexts/DiffContext'
import {buildObjectChangeList} from '../changes/buildChangeList'
import {undoChange} from '../changes/undoChange'
import {ChangeResolver} from './ChangeResolver'
import {DocumentChangeContext} from './DocumentChangeContext'
import {NoChanges} from './NoChanges'
import styles from './ChangeList.css'

interface Props {
  schemaType: ObjectSchemaType
  diff: ObjectDiff
  fields?: string[]
}

export function ChangeList({diff, fields, schemaType}: Props): React.ReactElement | null {
  const {documentId, isComparingCurrent} = React.useContext(DocumentChangeContext)
  const docOperations = useDocumentOperation(documentId, schemaType.name) as OperationsAPI
  const {path} = React.useContext(DiffContext)
  const isRoot = path.length === 0
  const [confirmRevertAllOpen, setConfirmRevertAllOpen] = React.useState(false)
  const [confirmRevertAllHover, setConfirmRevertAllHover] = React.useState(false)

  if (schemaType.jsonType !== 'object') {
    throw new Error(`Only object schema types are allowed in ChangeList`)
  }

  const allChanges = React.useMemo(
    () => buildObjectChangeList(schemaType, diff, path, [], {fieldFilter: fields}),
    [schemaType, fields, path, diff]
  )

  const changes = fields && fields.length === 0 ? [] : maybeFlatten(allChanges)

  const rootChange = allChanges[0]

  const revertAllChanges = React.useCallback(() => {
    undoChange(rootChange, diff, docOperations)
    setConfirmRevertAllOpen(false)
  }, [rootChange, diff, docOperations])

  const handleRevertAllChangesClick = React.useCallback(() => {
    setConfirmRevertAllOpen(true)
  }, [])

  const handleRevertAllChangesMouseEnter = React.useCallback(() => {
    setConfirmRevertAllHover(true)
  }, [])

  const handleRevertAllChangesMouseLeave = React.useCallback(() => {
    setConfirmRevertAllHover(false)
  }, [])

  const closeRevertAllChangesConfirmDialog = React.useCallback(() => {
    setConfirmRevertAllOpen(false)
  }, [])

  const handleConfirmDialogAction = useCallback((action: DialogAction) => {
    if (action.action) action.action()
  }, [])

  const [revertAllContainerElement, setRevertAllContainerElement] = useState<HTMLDivElement | null>(
    null
  )

  if (changes.length === 0) {
    return isRoot ? <NoChanges /> : null
  }

  const showFooter = isRoot && changes.length > 1

  return (
    <div
      className={styles.root}
      data-revert-all-changes-hover={confirmRevertAllHover ? '' : undefined}
    >
      <div className={styles.changeList}>
        {changes.map((change) => (
          <ChangeResolver change={change} key={change.key} />
        ))}
      </div>

      {showFooter && (
        <div className={styles.footer}>
          {isComparingCurrent && (
            <div className={styles.revertAllContainer} ref={setRevertAllContainerElement}>
              <Button
                color="danger"
                icon={UndoIcon}
                kind="secondary"
                onClick={handleRevertAllChangesClick}
                onMouseEnter={handleRevertAllChangesMouseEnter}
                onMouseLeave={handleRevertAllChangesMouseLeave}
                // selected={confirmRevertAllOpen}
              >
                Revert all changes
              </Button>
            </div>
          )}

          {confirmRevertAllOpen && (
            <PopoverDialog
              actions={[
                {
                  color: 'danger',
                  action: revertAllChanges,
                  title: 'Revert all',
                },
                {
                  kind: 'simple',
                  action: closeRevertAllChangesConfirmDialog,
                  title: 'Cancel',
                },
              ]}
              onAction={handleConfirmDialogAction}
              referenceElement={revertAllContainerElement}
              size="small"
            >
              Are you sure you want to revert all {changes.length} changes?
            </PopoverDialog>
          )}
        </div>
      )}
    </div>
  )
}

function maybeFlatten(changes: ChangeNode[]) {
  return changes.length === 1 && changes[0].type === 'group' && changes[0].path.length === 0
    ? changes[0].changes
    : changes
}
