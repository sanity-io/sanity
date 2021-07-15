import {DialogAction} from '@sanity/base/__legacy/@sanity/components'
import {LegacyLayerProvider} from '@sanity/base/components'
import {useDocumentOperation} from '@sanity/react-hooks'
import {Button, Card, Stack} from '@sanity/ui'
import {RevertIcon} from '@sanity/icons'
import PopoverDialog from 'part:@sanity/components/dialogs/popover'
import React, {useState, useCallback} from 'react'
import {unstable_useCheckDocumentPermission as useCheckDocumentPermission} from '@sanity/base/hooks'
import styled from 'styled-components'
import {ObjectDiff, ObjectSchemaType, ChangeNode, OperationsAPI} from '../../types'
import {DiffContext} from '../contexts/DiffContext'
import {buildObjectChangeList} from '../changes/buildChangeList'
import {undoChange} from '../changes/undoChange'
import {ChangeResolver} from './ChangeResolver'
import {DocumentChangeContext} from './DocumentChangeContext'
import {NoChanges} from './NoChanges'

interface Props {
  schemaType: ObjectSchemaType
  diff: ObjectDiff
  fields?: string[]
}

const ChangeListWrapper = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
`

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

  const updatePermission = useCheckDocumentPermission(documentId, schemaType.name, 'update')

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
    <Card>
      <Stack space={5}>
        <Stack as={ChangeListWrapper} space={5}>
          {changes.map((change) => (
            <ChangeResolver
              change={change}
              key={change.key}
              data-revert-all-changes-hover={confirmRevertAllHover ? '' : undefined}
              readOnly={schemaType.readOnly}
            />
          ))}
        </Stack>

        {showFooter && isComparingCurrent && updatePermission.granted && (
          <Stack ref={setRevertAllContainerElement}>
            <Button
              tone="critical"
              mode="ghost"
              text="Revert all changes"
              icon={RevertIcon}
              onClick={handleRevertAllChangesClick}
              onMouseEnter={handleRevertAllChangesMouseEnter}
              onMouseLeave={handleRevertAllChangesMouseLeave}
              disabled={schemaType?.readOnly}
            />
          </Stack>
        )}

        {confirmRevertAllOpen && (
          <LegacyLayerProvider zOffset="paneFooter">
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
              onClickOutside={closeRevertAllChangesConfirmDialog}
              referenceElement={revertAllContainerElement}
              size="small"
            >
              Are you sure you want to revert all {changes.length} changes?
            </PopoverDialog>
          </LegacyLayerProvider>
        )}
      </Stack>
    </Card>
  )
}

function maybeFlatten(changes: ChangeNode[]) {
  return changes.length === 1 && changes[0].type === 'group' && changes[0].path.length === 0
    ? changes[0].changes
    : changes
}
