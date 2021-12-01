import {useDocumentOperation} from '@sanity/react-hooks'
import {Button, Box, Card, Grid, Stack, Text, useClickOutside} from '@sanity/ui'
import {RevertIcon} from '@sanity/icons'
import React, {useState} from 'react'
import {
  unstable_useDocumentPairPermissions as useDocumentPairPermissions,
  unstable_useConditionalProperty as useConditionalProperty,
} from '@sanity/base/hooks'
import {SanityDocument} from '@sanity/client'
import {ObjectDiff, ObjectSchemaType, ChangeNode, OperationsAPI} from '../../types'
import {DiffContext} from '../contexts/DiffContext'
import {buildObjectChangeList} from '../changes/buildChangeList'
import {undoChange} from '../changes/undoChange'
import {ChangeResolver} from './ChangeResolver'
import {DocumentChangeContext} from './DocumentChangeContext'
import {NoChanges} from './NoChanges'

import {ChangeListWrapper, PopoverWrapper} from './ChangeList.styled'

interface Props {
  schemaType: ObjectSchemaType
  diff: ObjectDiff
  fields?: string[]
}

export function ChangeList({diff, fields, schemaType}: Props): React.ReactElement | null {
  const {documentId, isComparingCurrent, value} = React.useContext(DocumentChangeContext)
  const docOperations = useDocumentOperation(documentId, schemaType.name) as OperationsAPI
  const {path} = React.useContext(DiffContext)
  const isRoot = path.length === 0
  const [confirmRevertAllOpen, setConfirmRevertAllOpen] = React.useState(false)
  const [confirmRevertAllHover, setConfirmRevertAllHover] = React.useState(false)

  const isReadOnly = useConditionalProperty({
    document: value as SanityDocument,
    value: undefined,
    checkProperty: schemaType.readOnly,
    checkPropertyKey: 'readOnly',
  })

  if (schemaType.jsonType !== 'object') {
    throw new Error(`Only object schema types are allowed in ChangeList`)
  }

  const [permissions, isPermissionsLoading] = useDocumentPairPermissions({
    id: documentId,
    type: schemaType.name,
    permission: 'update',
  })

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

  const [revertAllContainerElement, setRevertAllContainerElement] = useState<HTMLDivElement | null>(
    null
  )

  useClickOutside(() => setConfirmRevertAllOpen(false), [revertAllContainerElement])

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
              readOnly={isReadOnly || change?.readOnly}
              hidden={change?.hidden}
            />
          ))}
        </Stack>

        {showFooter && isComparingCurrent && !isPermissionsLoading && permissions?.granted && (
          <PopoverWrapper
            content={
              <Box>
                Are you sure you want to revert all {changes.length} changes?
                <Grid columns={2} gap={2} marginTop={2}>
                  <Button mode="ghost" text="Cancel" onClick={closeRevertAllChangesConfirmDialog} />
                  <Button tone="critical" text="Revert all" onClick={revertAllChanges} />
                </Grid>
              </Box>
            }
            open={confirmRevertAllOpen}
            padding={4}
            placement={'left'}
            portal
            ref={setRevertAllContainerElement}
          >
            <Stack>
              <Button
                tone="critical"
                mode="ghost"
                text="Revert all changes"
                icon={RevertIcon}
                onClick={handleRevertAllChangesClick}
                onMouseEnter={handleRevertAllChangesMouseEnter}
                onMouseLeave={handleRevertAllChangesMouseLeave}
                disabled={isReadOnly}
              />
            </Stack>
          </PopoverWrapper>
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
