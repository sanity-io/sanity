import React, {useCallback, useContext, useMemo, useState} from 'react'
import {Box, Stack, Button, Grid, Text, useClickOutside} from '@sanity/ui'
import {useDocumentOperation} from '../../../hooks'
import {undoChange} from '../changes/undoChange'
import {isFieldChange} from '../helpers'
import {isPTSchemaType} from '../../types/portableText/diff'
import {GroupChangeNode, FieldOperationsAPI} from '../../types'
import {useHover} from '../../utils/useHover'
import {pathsAreEqual} from '../../paths'
import {DiffContext} from '../contexts/DiffContext'
import {useDocumentChange} from '../hooks'
import {useDocumentPairPermissions} from '../../../store'
import {ChangeBreadcrumb} from './ChangeBreadcrumb'
import {ChangeResolver} from './ChangeResolver'
import {RevertChangesButton} from './RevertChangesButton'
import {ChangeListWrapper, GroupChangeContainer, PopoverWrapper} from './GroupChange.styled'

/** @internal */
export function GroupChange(
  props: {
    change: GroupChangeNode
    readOnly?: boolean
    hidden?: boolean
  } & React.HTMLAttributes<HTMLDivElement>
): React.ReactElement | null {
  const {
    change: group,
    readOnly,
    hidden,
    // 'data-revert-all-changes-hover': dataRevertAllChangesHover,
    ...restProps
  } = props
  const {titlePath, changes, path: groupPath} = group
  const {path: diffPath} = useContext(DiffContext)
  const {documentId, schemaType, FieldWrapper, rootDiff, isComparingCurrent} = useDocumentChange()

  const isPortableText = changes.every(
    (change) => isFieldChange(change) && isPTSchemaType(change.schemaType)
  )

  const isNestedInDiff = pathsAreEqual(diffPath, groupPath)
  const [revertButtonRef, isRevertButtonHovered] = useHover<HTMLButtonElement>()

  const docOperations = useDocumentOperation(documentId, schemaType.name) as FieldOperationsAPI
  const [confirmRevertOpen, setConfirmRevertOpen] = useState(false)
  const [revertPopoverElement, setRevertPopoverElement] = useState<HTMLDivElement | null>(null)

  const [permissions, isPermissionsLoading] = useDocumentPairPermissions({
    id: documentId,
    type: schemaType.name,
    permission: 'update',
  })

  const handleRevertChanges = useCallback(
    () => undoChange(group, rootDiff, docOperations),
    [group, rootDiff, docOperations]
  )

  const handleRevertChangesConfirm = useCallback(() => {
    setConfirmRevertOpen(true)
  }, [])

  const closeRevertChangesConfirmDialog = useCallback(() => {
    setConfirmRevertOpen(false)
  }, [])

  useClickOutside(() => setConfirmRevertOpen(false), [revertPopoverElement])

  const content = useMemo(
    () =>
      hidden ? null : (
        <Stack
          space={1}
          as={GroupChangeContainer}
          data-revert-group-hover={isRevertButtonHovered ? '' : undefined}
          data-portable-text={isPortableText ? '' : undefined}
          // data-revert-all-groups-hover={
          //   restProps[] === '' ? '' : undefined
          // }
        >
          <Stack as={ChangeListWrapper} space={5}>
            {changes.map((change) => (
              <ChangeResolver
                key={change.key}
                change={change}
                readOnly={readOnly}
                hidden={hidden}
              />
            ))}
          </Stack>
          {isComparingCurrent && !isPermissionsLoading && permissions?.granted && (
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
              ref={setRevertPopoverElement}
            >
              <Box>
                <RevertChangesButton
                  onClick={handleRevertChangesConfirm}
                  ref={revertButtonRef}
                  selected={confirmRevertOpen}
                  disabled={readOnly}
                  data-testid={`group-change-revert-button-${group.fieldsetName}`}
                />
              </Box>
            </PopoverWrapper>
          )}
        </Stack>
      ),
    [
      changes,
      closeRevertChangesConfirmDialog,
      confirmRevertOpen,
      readOnly,
      group.fieldsetName,
      handleRevertChanges,
      handleRevertChangesConfirm,
      hidden,
      isComparingCurrent,
      isRevertButtonHovered,
      isPermissionsLoading,
      isPortableText,
      permissions,
      revertButtonRef,
    ]
  )

  return hidden ? null : (
    <Stack space={1} {...restProps}>
      <ChangeBreadcrumb titlePath={titlePath} />
      {isNestedInDiff || !FieldWrapper ? (
        content
      ) : (
        <FieldWrapper hasHover={isRevertButtonHovered} path={group.path}>
          {content}
        </FieldWrapper>
      )}
    </Stack>
  )
}
