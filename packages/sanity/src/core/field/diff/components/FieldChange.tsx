import React, {useCallback, useMemo, useState} from 'react'
import {Stack, Box, Button, Text, Grid, useClickOutside} from '@sanity/ui'
import {useConditionalReadOnly} from '../../conditional-property/conditionalReadOnly'
import {useDocumentOperation} from '../../../hooks'
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

const nooRenderDefault = () => <></>

/** @internal */
export function FieldChange(
  props: {
    change: FieldChangeNode
    readOnly?: boolean
    hidden?: boolean
  } & React.HTMLAttributes<HTMLDivElement>
) {
  const {change, hidden, readOnly} = props
  const conditionalReadOnly = useConditionalReadOnly() ?? readOnly
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

  const DiffComponent = change.diffComponent || FallbackDiff

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

  const closeRevertChangesConfirmDialog = useCallback(() => {
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

  const showRevertButton = isComparingCurrent && !isPermissionsLoading && permissions?.granted

  const content = useMemo(
    () => (
      <DiffInspectWrapper
        change={change}
        as={DiffBorder}
        data-revert-field-hover={revertHovered ? '' : undefined}
        data-error={change.error ? '' : undefined}
        data-revert-all-hover
      >
        <Stack space={1}>
          {change.error ? (
            <ValueError error={change.error} />
          ) : (
            <DiffErrorBoundary>
              <DiffContext.Provider value={{path: change.path}}>
                <DiffComponent
                  diff={change.diff}
                  schemaType={change.schemaType}
                  renderDefault={nooRenderDefault} // TODO
                />
              </DiffContext.Provider>
            </DiffErrorBoundary>
          )}
          {showRevertButton && (
            <PopoverWrapper
              content={
                <Stack space={2}>
                  <Text>Are you sure you want to revert the changes?</Text>
                  <Grid columns={2} gap={2} marginTop={2}>
                    <Button mode="ghost" onClick={closeRevertChangesConfirmDialog} text="Cancel" />
                    <Button tone="critical" onClick={handleRevertChanges} text="Revert change" />
                  </Grid>
                </Stack>
              }
              open={confirmRevertOpen}
              padding={4}
              placement="left"
              portal
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
        </Stack>
      </DiffInspectWrapper>
    ),
    [
      DiffComponent,
      change,
      closeRevertChangesConfirmDialog,
      conditionalReadOnly,
      confirmRevertOpen,
      handleRevertButtonMouseEnter,
      handleRevertButtonMouseLeave,
      handleRevertChanges,
      handleRevertChangesConfirm,
      revertHovered,
      showRevertButton,
    ]
  )

  if (hidden) return null

  return (
    <Stack space={1} as={FieldChangeContainer}>
      {change?.showHeader && <ChangeBreadcrumb change={change} titlePath={change.titlePath} />}

      <FieldWrapper path={change.path} hasHover={revertHovered}>
        {content}
      </FieldWrapper>
    </Stack>
  )
}
