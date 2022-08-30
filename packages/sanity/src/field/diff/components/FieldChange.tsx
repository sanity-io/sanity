import React, {useCallback, useMemo, useState} from 'react'
import {Stack, Box, Button, Text, Grid, useClickOutside} from '@sanity/ui'
import {useConditionalReadOnly} from '../../../conditional-property/conditionalReadOnly'
import {useDocumentOperation} from '../../../hooks'
import {FieldChangeNode, FieldOperationsAPI} from '../../types'
import {undoChange} from '../changes/undoChange'
import {DiffContext} from '../contexts/DiffContext'
import {useDocumentChange} from '../hooks'
import {useDocumentPairPermissions} from '../../../datastores'
import {useSource} from '../../../studio'
import {ChangeBreadcrumb} from './ChangeBreadcrumb'
import {DiffErrorBoundary} from './DiffErrorBoundary'
import {DiffInspectWrapper} from './DiffInspectWrapper'
import {RevertChangesButton} from './RevertChangesButton'
import {ValueError} from './ValueError'
import {FieldChangeContainer, DiffBorder, PopoverWrapper} from './FieldChange.styled'

export function FieldChange(
  props: {
    change: FieldChangeNode
    readOnly?: boolean
    hidden?: boolean
  } & React.HTMLAttributes<HTMLDivElement>
) {
  const {change, hidden, readOnly} = props
  const conditionalReadOnly = useConditionalReadOnly() ?? readOnly
  const {renderDiff} = useSource().form

  const {
    documentId,
    schemaType,
    rootDiff,
    isComparingCurrent,
    FieldWrapper = React.Fragment,
  } = useDocumentChange()
  const ops = useDocumentOperation(documentId, schemaType.name) as FieldOperationsAPI
  const [confirmRevertOpen, setConfirmRevertOpen] = useState(false)
  const [revertHovered, setRevertHovered] = useState(false)
  const [revertButtonElement, setRevertButtonElement] = useState<HTMLDivElement | null>(null)

  const [permissions, isPermissionsLoading] = useDocumentPairPermissions({
    id: documentId,
    type: schemaType.name,
    permission: 'update',
  })

  const handleRevertChanges = useCallback(() => {
    undoChange(change, rootDiff, ops)
  }, [change, rootDiff, ops])

  const handleRevertChangesConfirm = useCallback(() => {
    setConfirmRevertOpen(true)
  }, [])

  const closeRevertChangesConfirmDialog = React.useCallback(() => {
    setConfirmRevertOpen(false)
  }, [])

  const handleRevertButtonMouseEnter = useCallback(() => {
    setRevertHovered(true)
  }, [])

  const handleRevertButtonMouseLeave = useCallback(() => {
    setRevertHovered(false)
  }, [])

  const handleClickOutside = useCallback(() => setConfirmRevertOpen(false), [])

  useClickOutside(handleClickOutside, [revertButtonElement])

  const content = useMemo(
    () =>
      hidden ? null : (
        <Stack space={1} as={FieldChangeContainer}>
          {change.showHeader && <ChangeBreadcrumb change={change} titlePath={change.titlePath} />}

          <FieldWrapper path={change.path} hasHover={revertHovered}>
            <DiffInspectWrapper
              change={change}
              as={DiffBorder}
              data-revert-field-hover={revertHovered ? '' : undefined}
              data-error={change.error ? '' : undefined}
              data-revert-all-hover
            >
              {change.error ? (
                <ValueError error={change.error} />
              ) : (
                <DiffErrorBoundary>
                  <DiffContext.Provider value={{path: change.path}}>
                    {change.diffNode ||
                      renderDiff({diff: change.diff, schemaType: change.schemaType})}
                  </DiffContext.Provider>
                </DiffErrorBoundary>
              )}

              {isComparingCurrent && !isPermissionsLoading && permissions?.granted && (
                <PopoverWrapper
                  content={
                    <Stack space={3} padding={4}>
                      <Text size={1}>Are you sure you want to revert the changes?</Text>

                      <Grid columns={2} gap={2}>
                        <Button
                          mode="ghost"
                          onClick={closeRevertChangesConfirmDialog}
                          text="Cancel"
                        />
                        <Button
                          tone="critical"
                          onClick={handleRevertChanges}
                          text="Revert change"
                        />
                      </Grid>
                    </Stack>
                  }
                  open={confirmRevertOpen}
                  portal
                  placement="left"
                  ref={setRevertButtonElement}
                >
                  <Box flex={1}>
                    <RevertChangesButton
                      onClick={handleRevertChangesConfirm}
                      onMouseEnter={handleRevertButtonMouseEnter}
                      onMouseLeave={handleRevertButtonMouseLeave}
                      selected={confirmRevertOpen}
                      disabled={conditionalReadOnly}
                      data-testid={`single-change-revert-button-${change?.key}`}
                    />
                  </Box>
                </PopoverWrapper>
              )}
            </DiffInspectWrapper>
          </FieldWrapper>
        </Stack>
      ),
    [
      change,
      closeRevertChangesConfirmDialog,
      conditionalReadOnly,
      confirmRevertOpen,
      FieldWrapper,
      handleRevertButtonMouseEnter,
      handleRevertButtonMouseLeave,
      handleRevertChanges,
      handleRevertChangesConfirm,
      hidden,
      isComparingCurrent,
      isPermissionsLoading,
      permissions,
      renderDiff,
      revertHovered,
    ]
  )

  return content
}
