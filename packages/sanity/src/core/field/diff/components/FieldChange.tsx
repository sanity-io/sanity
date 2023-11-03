import React, {useCallback, useMemo, useState} from 'react'
import {Stack, Box, Text, Grid, useClickOutside} from '@sanity/ui'
import {ObjectSchemaType} from '@sanity/types'
import {useDocumentOperation} from '../../../hooks'
import {Button} from '../../../../ui'
import {FieldChangeNode, FieldOperationsAPI} from '../../types'
import {undoChange} from '../changes/undoChange'
import {DiffContext} from '../contexts/DiffContext'
import {useDocumentChange} from '../hooks'
import {useDocumentPairPermissions} from '../../../store'
import {ChangeBreadcrumb} from './ChangeBreadcrumb'
import {DiffErrorBoundary} from './DiffErrorBoundary'
import {DiffInspectWrapper} from './DiffInspectWrapper'
import {FallbackDiff} from './FallbackDiff'
import {RevertChangesButton} from './RevertChangesButton'
import {ValueError} from './ValueError'
import {FieldChangeContainer, DiffBorder, PopoverWrapper} from './FieldChange.styled'

/** @internal */
export function FieldChange(
  props: {
    change: FieldChangeNode
    readOnly?: boolean
    hidden?: boolean
  } & React.HTMLAttributes<HTMLDivElement>,
) {
  const {change, hidden, readOnly} = props
  const DiffComponent = change.diffComponent || FallbackDiff
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

  const isArray = change.parentSchema?.jsonType === 'array'

  /* this condition is required in order to avoid situations where an array change has happened
   * but not necessarily an array item change. E.g. when adding one new item to an array, the changes pane
   * would be able to identify that a new item was addded but not what array it belonged to (because the change path
   * is only related to the item itself, not the array)
   */
  const fieldPath = isArray ? change.path.slice(0, -1) : change.path

  const content = useMemo(
    () =>
      hidden ? null : (
        <Stack space={1} as={FieldChangeContainer}>
          {change.showHeader && <ChangeBreadcrumb change={change} titlePath={change.titlePath} />}

          <FieldWrapper path={fieldPath} hasHover={revertHovered}>
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
                    <DiffComponent
                      diff={change.diff}
                      schemaType={change.schemaType as ObjectSchemaType}
                    />
                  </DiffContext.Provider>
                </DiffErrorBoundary>
              )}

              {isComparingCurrent && !isPermissionsLoading && permissions?.granted && (
                <PopoverWrapper
                  content={
                    <Box padding={3} sizing="border">
                      Are you sure you want to revert the changes?
                      <Grid columns={2} gap={2} marginTop={2}>
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
                    </Box>
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
                      disabled={readOnly}
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
      readOnly,
      confirmRevertOpen,
      DiffComponent,
      FieldWrapper,
      hidden,
      handleRevertButtonMouseEnter,
      handleRevertButtonMouseLeave,
      handleRevertChanges,
      handleRevertChangesConfirm,
      isComparingCurrent,
      isPermissionsLoading,
      permissions,
      revertHovered,
      fieldPath,
    ],
  )

  return content
}
