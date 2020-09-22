import * as React from 'react'
import {useDocumentOperation} from '@sanity/react-hooks'
import UndoIcon from 'part:@sanity/base/undo-icon'
import Button from 'part:@sanity/components/buttons/default'
import {ClickOutside} from 'part:@sanity/components/click-outside'
import {Popover} from 'part:@sanity/components/popover'
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
  const {documentId} = React.useContext(DocumentChangeContext)
  const docOperations = useDocumentOperation(documentId, schemaType.name) as OperationsAPI
  const {path} = React.useContext(DiffContext)
  const isRoot = path.length === 0
  const [confirmRevertAllOpen, setConfirmRevertAllOpen] = React.useState(false)

  if (schemaType.jsonType !== 'object') {
    throw new Error(`Only object schema types are allowed in ChangeList`)
  }

  const allChanges = React.useMemo(
    () => buildObjectChangeList(schemaType, diff, path, [], {fieldFilter: fields}),
    [schemaType, fields, path, diff]
  )

  const changes = fields && fields.length === 0 ? [] : maybeFlatten(allChanges)

  const rootChange = allChanges[0]
  const handleRevertAllChanges = React.useCallback(() => {
    undoChange(rootChange, diff, docOperations)
    setConfirmRevertAllOpen(false)
  }, [rootChange, diff, docOperations])

  const handleRevertAllChangesClick = React.useCallback(() => {
    setConfirmRevertAllOpen(true)
  }, [])

  const handleRevertAllChangesClickOutside = React.useCallback(() => {
    setConfirmRevertAllOpen(false)
  }, [])

  const handleRevertAllChangesKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Escape') {
        setConfirmRevertAllOpen(false)
      }
    },
    []
  )

  if (changes.length === 0) {
    return isRoot ? <NoChanges /> : null
  }

  return (
    <>
      {changes.map(change => (
        <ChangeResolver change={change} key={change.key} />
      ))}

      {path.length === 0 && changes.length > 1 && (
        <ClickOutside onClickOutside={handleRevertAllChangesClickOutside}>
          {ref => (
            <div className={styles.footer} onKeyDown={handleRevertAllChangesKeyDown} ref={ref}>
              <Popover
                content={
                  <div className={styles.confirmPopoverContent}>
                    <Button
                      // autoFocus
                      color="danger"
                      onClick={handleRevertAllChanges}
                      kind="simple"
                    >
                      Yes, revert all changes
                    </Button>
                  </div>
                }
                open={confirmRevertAllOpen}
                placement="top"
              >
                <div className={styles.revertAllContainer}>
                  <Button
                    color="danger"
                    icon={UndoIcon}
                    kind="secondary"
                    onClick={handleRevertAllChangesClick}
                    // selected={confirmRevertAllOpen}
                  >
                    Revert all changes
                  </Button>
                </div>
              </Popover>
            </div>
          )}
        </ClickOutside>
      )}
    </>
  )
}

function maybeFlatten(changes: ChangeNode[]) {
  return changes.length === 1 && changes[0].type === 'group' && changes[0].path.length === 0
    ? changes[0].changes
    : changes
}
