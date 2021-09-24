import {useDocumentOperation} from '@sanity/react-hooks'
import React, {useCallback, useContext, useState} from 'react'
import {unstable_useCheckDocumentPermission as useCheckDocumentPermission} from '@sanity/base/hooks'
import {Box, Stack, Button, Grid, Text, useClickOutside} from '@sanity/ui'
import {undoChange} from '../changes/undoChange'
import {isFieldChange} from '../helpers'
import {isPTSchemaType} from '../../types/portableText/diff'
import {GroupChangeNode, OperationsAPI} from '../../types'
import {useHover} from '../../utils/useHover'
import {pathsAreEqual} from '../../paths'
import {DiffContext} from '../contexts/DiffContext'
import {ChangeBreadcrumb} from './ChangeBreadcrumb'
import {ChangeResolver} from './ChangeResolver'
import {DocumentChangeContext} from './DocumentChangeContext'
import {RevertChangesButton} from './RevertChangesButton'

import {ChangeListWrapper, GroupChangeContainer, PopoverWrapper} from './GroupChange.styled'

export function GroupChange({
  change: group,
  readOnly,
  ...restProps
}: {change: GroupChangeNode; readOnly?: boolean} & React.HTMLAttributes<
  HTMLDivElement
>): React.ReactElement | null {
  const {titlePath, changes, path: groupPath} = group
  const {path: diffPath} = useContext(DiffContext)
  const {documentId, schemaType, FieldWrapper, rootDiff, isComparingCurrent} = useContext(
    DocumentChangeContext
  )

  const isPortableText = changes.every(
    (change) => isFieldChange(change) && isPTSchemaType(change.schemaType)
  )

  const isNestedInDiff = pathsAreEqual(diffPath, groupPath)
  const [hoverRef, isHoveringRevert] = useHover<HTMLDivElement>()
  const docOperations = useDocumentOperation(documentId, schemaType.name) as OperationsAPI
  const [confirmRevertOpen, setConfirmRevertOpen] = useState(false)
  const [revertButtonElement, setRevertButtonElement] = useState<HTMLDivElement | null>(null)

  const updatePermission = useCheckDocumentPermission(documentId, schemaType.name, 'update')

  const handleRevertChanges = useCallback(() => undoChange(group, rootDiff, docOperations), [
    group,
    rootDiff,
    docOperations,
  ])

  const handleRevertChangesConfirm = useCallback(() => {
    setConfirmRevertOpen(true)
  }, [])

  const closeRevertChangesConfirmDialog = useCallback(() => {
    setConfirmRevertOpen(false)
  }, [])

  useClickOutside(() => setConfirmRevertOpen(false), [revertButtonElement])

  const setRevertButtonRef = useCallback(
    (el: HTMLDivElement | null) => {
      hoverRef.current = el
      setRevertButtonElement(el)
    },
    [hoverRef]
  )
  const content = (
    <Stack
      space={1}
      as={GroupChangeContainer}
      data-revert-group-hover={isHoveringRevert ? '' : undefined}
      data-portable-text={isPortableText ? '' : undefined}
      data-revert-all-groups-hover={
        restProps['data-revert-all-changes-hover'] === '' ? '' : undefined
      }
    >
      <Stack as={ChangeListWrapper} space={5}>
        {changes.map((change) => (
          <ChangeResolver
            key={change.key}
            change={change}
            readOnly={readOnly || group?.schemaType?.readOnly}
          />
        ))}
      </Stack>
      {isComparingCurrent && updatePermission.granted && (
        <PopoverWrapper
          content={
            <Box>
              Are you sure you want to revert the changes?
              <Grid columns={2} gap={2} marginTop={2}>
                <Button mode="ghost" onClick={closeRevertChangesConfirmDialog}>
                  <Text align="center">Cancel</Text>
                </Button>
                <Button tone="critical" onClick={handleRevertChanges}>
                  <Text align="center">Revert change</Text>
                </Button>
              </Grid>
            </Box>
          }
          portal
          padding={4}
          placement={'left'}
          open={confirmRevertOpen}
          ref={setRevertButtonElement}
        >
          <Box>
            <RevertChangesButton
              onClick={handleRevertChangesConfirm}
              ref={setRevertButtonRef}
              selected={confirmRevertOpen}
              disabled={group?.schemaType?.readOnly || readOnly}
            />
          </Box>
        </PopoverWrapper>
      )}
    </Stack>
  )

  return (group?.schemaType as any)?.hidden ? null : (
    <Stack space={1} {...restProps}>
      <ChangeBreadcrumb titlePath={titlePath} />
      {isNestedInDiff || !FieldWrapper ? (
        content
      ) : (
        <FieldWrapper path={group.path} hasHover={isHoveringRevert}>
          {content}
        </FieldWrapper>
      )}
    </Stack>
  )
}
