import React, {useCallback, useMemo, useState} from 'react'
import {Stack, Box, Button, Text, Grid, useClickOutside} from '@sanity/ui'
import {ObjectSchemaType} from '@sanity/types'
import {useConditionalReadOnly} from '../../conditional-property/conditionalReadOnly'
import {useDocumentOperation} from '../../../hooks'
import {FieldChangeNode, FieldOperationsAPI} from '../../types'
import {undoChange} from '../changes/undoChange'
import {DiffContext} from '../contexts/DiffContext'
import {useDocumentChange} from '../hooks'
import {useDocumentPairPermissions} from '../../../store'
import {useTranslation} from '../../../i18n'
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
  } & React.HTMLAttributes<HTMLDivElement>
) {
  const {change, hidden, readOnly} = props
  const conditionalReadOnly = useConditionalReadOnly() ?? readOnly
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
  const {t} = useTranslation()

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
                      {t('changes.action.revert-changes-description')}
                      <Grid columns={2} gap={2} marginTop={2}>
                        <Button mode="ghost" onClick={closeRevertChangesConfirmDialog}>
                          <Text align="center">{t('changes.action.revert-all-cancel')}</Text>
                        </Button>
                        <Button tone="critical" onClick={handleRevertChanges}>
                          <Text align="center">
                            {t('changes.action.revert-changes-confirm-change', {count: 1})}
                          </Text>
                        </Button>
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
                      changeCount={1}
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
      hidden,
      change,
      FieldWrapper,
      revertHovered,
      DiffComponent,
      isComparingCurrent,
      isPermissionsLoading,
      permissions?.granted,
      t,
      closeRevertChangesConfirmDialog,
      handleRevertChanges,
      confirmRevertOpen,
      handleRevertChangesConfirm,
      handleRevertButtonMouseEnter,
      handleRevertButtonMouseLeave,
      conditionalReadOnly,
    ]
  )

  return content
}
