import React, {useCallback, useMemo, useState} from 'react'
import {Box, Grid, Stack, Text, useClickOutside} from '@sanity/ui'
import {ObjectSchemaType} from '@sanity/types'
import {useDocumentOperation} from '../../../hooks'
import {Button, Popover} from '../../../ui-components'
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
import {FieldChangeContainer, DiffBorder} from './FieldChange.styled'

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
                <DiffErrorBoundary t={t}>
                  <DiffContext.Provider value={{path: change.path}}>
                    <DiffComponent
                      diff={change.diff}
                      schemaType={change.schemaType as ObjectSchemaType}
                    />
                  </DiffContext.Provider>
                </DiffErrorBoundary>
              )}

              {isComparingCurrent && !isPermissionsLoading && permissions?.granted && (
                <Popover
                  content={
                    <Stack space={1}>
                      <Box padding={1}>
                        <Text size={1}>
                          {t('changes.action.revert-changes-description', {count: 1})}
                        </Text>
                      </Box>
                      <Grid columns={2} gap={2} marginTop={2}>
                        <Button
                          mode="ghost"
                          onClick={closeRevertChangesConfirmDialog}
                          text={t('changes.action.revert-all-cancel')}
                        />
                        <Button
                          tone="critical"
                          onClick={handleRevertChanges}
                          text={t('changes.action.revert-changes-confirm-change', {count: 1})}
                        />
                      </Grid>
                    </Stack>
                  }
                  open={confirmRevertOpen}
                  padding={3}
                  portal
                  placement="left"
                  ref={setRevertButtonElement}
                >
                  <RevertChangesButton
                    changeCount={1}
                    onClick={handleRevertChangesConfirm}
                    onMouseEnter={handleRevertButtonMouseEnter}
                    onMouseLeave={handleRevertButtonMouseLeave}
                    selected={confirmRevertOpen}
                    disabled={readOnly}
                    data-testid={`single-change-revert-button-${change?.key}`}
                  />
                </Popover>
              )}
            </DiffInspectWrapper>
          </FieldWrapper>
        </Stack>
      ),
    [
      change,
      closeRevertChangesConfirmDialog,
      confirmRevertOpen,
      DiffComponent,
      fieldPath,
      FieldWrapper,
      handleRevertButtonMouseEnter,
      handleRevertButtonMouseLeave,
      handleRevertChanges,
      handleRevertChangesConfirm,
      hidden,
      isComparingCurrent,
      isPermissionsLoading,
      permissions?.granted,
      readOnly,
      revertHovered,
      t,
    ],
  )

  return content
}
