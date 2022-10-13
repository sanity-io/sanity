import {RevertIcon} from '@sanity/icons'
import {ObjectSchemaType, SanityDocument} from '@sanity/types'
import {Button, Grid, Stack, Text, useClickOutside} from '@sanity/ui'
import React, {useCallback, useContext, useMemo, useState} from 'react'
import {useDiffComponent} from '../../../form/form-components-hooks'
import {useDocumentOperation} from '../../../hooks'
import {useDocumentPairPermissions} from '../../../store'
import {unstable_useConditionalProperty as useConditionalProperty} from '../../conditional-property'
import {ChangeResolver, DiffContext, NoChanges, useDocumentChange} from '../../diff'
import {buildObjectChangeList} from '../../diff/changes/buildChangeList'
import {undoChange} from '../../diff/changes/undoChange'
import {ChangeListWrapper, PopoverWrapper} from '../../diff/components/ChangeList.styled'
import {ChangeNode, FieldOperationsAPI, ObjectDiff} from '../../types'

function maybeFlatten(changes: ChangeNode[]) {
  return changes.length === 1 && changes[0].type === 'group' && changes[0].path.length === 0
    ? changes[0].changes
    : changes
}

interface ChangeListProps {
  diff: ObjectDiff
  schemaType: ObjectSchemaType
  fields?: string[]
}

/** @internal */
export function ChangeList(props: ChangeListProps) {
  if (props.schemaType.jsonType !== 'object') {
    throw new Error(`Only object schema types are allowed in ObjectFieldDiff`)
  }

  const {diff, schemaType, fields} = props
  const {documentId, isComparingCurrent, value} = useDocumentChange()
  const docOperations = useDocumentOperation(documentId, schemaType.name) as FieldOperationsAPI
  const {path} = useContext(DiffContext)
  const [permissions, isPermissionsLoading] = useDocumentPairPermissions({
    id: documentId,
    type: schemaType.name,
    permission: 'update',
  })

  const DiffComponent = useDiffComponent()

  const isRoot = path.length === 0

  const [confirmRevertAllOpen, setConfirmRevertAllOpen] = useState(false)
  const [confirmRevertAllHover, setConfirmRevertAllHover] = useState(false)
  const [revertAllContainerElement, setRevertAllContainerElement] = useState<HTMLDivElement | null>(
    null
  )

  const isReadOnly = useConditionalProperty({
    document: value as SanityDocument,
    value: undefined,
    checkProperty: schemaType.readOnly,
    checkPropertyKey: 'readOnly',
  })

  const allChanges = useMemo(
    () =>
      buildObjectChangeList(schemaType, diff, path, [], {
        fieldFilter: fields,
        diffComponent: DiffComponent,
      }),
    [schemaType, diff, path, fields, DiffComponent]
  )

  const changes = useMemo(
    () => (fields && fields.length === 0 ? [] : maybeFlatten(allChanges)),
    [allChanges, fields]
  )

  const rootChange = allChanges[0]

  const revertAllChanges = useCallback(() => {
    undoChange(rootChange, diff, docOperations)
    setConfirmRevertAllOpen(false)
  }, [rootChange, diff, docOperations])

  const handleRevertAllChangesClick = useCallback(() => {
    setConfirmRevertAllOpen(true)
  }, [])

  const handleRevertAllChangesMouseEnter = useCallback(() => {
    setConfirmRevertAllHover(true)
  }, [])

  const handleRevertAllChangesMouseLeave = useCallback(() => {
    setConfirmRevertAllHover(false)
  }, [])

  const closeRevertAllChangesConfirmDialog = useCallback(() => {
    setConfirmRevertAllOpen(false)
  }, [])

  const handleClickOutside = useCallback(() => setConfirmRevertAllOpen(false), [])

  useClickOutside(handleClickOutside, [revertAllContainerElement])

  const showFooter =
    isRoot &&
    changes.length > 1 &&
    isComparingCurrent &&
    !isPermissionsLoading &&
    permissions?.granted

  if (changes.length === 0) {
    return isRoot ? <NoChanges /> : null
  }

  return (
    <Stack space={5}>
      <Stack space={5} as={ChangeListWrapper}>
        {changes.map((change) => {
          return (
            <ChangeResolver
              change={change}
              data-revert-all-changes-hover={confirmRevertAllHover ? '' : undefined}
              hidden={change?.hidden}
              key={change.key}
              readOnly={isReadOnly || change?.readOnly}
            />
          )
        })}
      </Stack>

      {showFooter && (
        <PopoverWrapper
          content={
            <Stack space={2}>
              <Text>Are you sure you want to revert all {changes.length} changes?</Text>
              <Grid columns={2} gap={2} marginTop={2}>
                <Button mode="ghost" text="Cancel" onClick={closeRevertAllChangesConfirmDialog} />
                <Button tone="critical" text="Revert all" onClick={revertAllChanges} />
              </Grid>
            </Stack>
          }
          open={confirmRevertAllOpen}
          padding={4}
          placement="left"
          portal
          ref={setRevertAllContainerElement}
        >
          <Stack>
            <Button
              disabled={isReadOnly}
              icon={RevertIcon}
              mode="ghost"
              onClick={handleRevertAllChangesClick}
              onMouseEnter={handleRevertAllChangesMouseEnter}
              onMouseLeave={handleRevertAllChangesMouseLeave}
              text="Revert all changes"
              tone="critical"
            />
          </Stack>
        </PopoverWrapper>
      )}
    </Stack>
  )
}
