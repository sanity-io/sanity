import {type ObjectSchemaType} from '@sanity/types'
import {Box, Flex, Stack, Text, useClickOutsideEvent} from '@sanity/ui'
import {Fragment, type HTMLAttributes, useCallback, useMemo, useRef, useState} from 'react'
import {DiffContext} from 'sanity/_singletons'

import {Button, Popover} from '../../../../ui-components'
import {useDocumentOperation} from '../../../hooks'
import {useTranslation} from '../../../i18n'
import {useDocumentPairPermissions} from '../../../store'
import {type FieldChangeNode, type FieldOperationsAPI} from '../../types'
import {undoChange} from '../changes/undoChange'
import {useDocumentChange} from '../hooks'
import {ChangeBreadcrumb} from './ChangeBreadcrumb'
import {DiffErrorBoundary} from './DiffErrorBoundary'
import {DiffInspectWrapper} from './DiffInspectWrapper'
import {FallbackDiff} from './FallbackDiff'
import {DiffBorder, FieldChangeContainer} from './FieldChange.styled'
import {RevertChangesButton} from './RevertChangesButton'
import {ValueError} from './ValueError'

/** @internal */
export function FieldChange(
  props: {
    change: FieldChangeNode
    readOnly?: boolean
    hidden?: boolean
  } & HTMLAttributes<HTMLDivElement>,
) {
  const {change, hidden, readOnly} = props
  const DiffComponent = change.diffComponent || FallbackDiff
  const {
    documentId,
    schemaType,
    rootDiff,
    isComparingCurrent,
    FieldWrapper = Fragment,
  } = useDocumentChange()
  const ops = useDocumentOperation(documentId, schemaType.name) as FieldOperationsAPI
  const [confirmRevertOpen, setConfirmRevertOpen] = useState(false)
  const [revertHovered, setRevertHovered] = useState(false)
  const popoverRef = useRef<HTMLDivElement | null>(null)
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

  const closeRevertChangesConfirmDialog = useCallback(() => {
    setConfirmRevertOpen(false)
  }, [])

  const handleRevertButtonMouseEnter = useCallback(() => {
    setRevertHovered(true)
  }, [])

  const handleRevertButtonMouseLeave = useCallback(() => {
    setRevertHovered(false)
  }, [])

  useClickOutsideEvent(
    () => setConfirmRevertOpen(false),
    () => [popoverRef.current],
  )

  const isArray = change.parentSchema?.jsonType === 'array'

  /* this condition is required in order to avoid situations where an array change has happened
   * but not necessarily an array item change. E.g. when adding one new item to an array, the changes pane
   * would be able to identify that a new item was addded but not what array it belonged to (because the change path
   * is only related to the item itself, not the array)
   */
  const fieldPath = isArray ? change.path.slice(0, -1) : change.path

  const value = useMemo(() => ({path: change.path}), [change.path])

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
              data-ui="field-diff-inspect-wrapper"
            >
              {change.error ? (
                <ValueError error={change.error} />
              ) : (
                <DiffErrorBoundary t={t}>
                  <DiffContext.Provider value={value}>
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
                    <Stack space={3}>
                      <Box paddingY={3}>
                        <Text size={1}>
                          {t('changes.action.revert-changes-description', {count: 1})}
                        </Text>
                      </Box>
                      <Flex gap={3} justify="flex-end">
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
                      </Flex>
                    </Stack>
                  }
                  open={confirmRevertOpen}
                  padding={3}
                  portal
                  placement="left"
                  ref={popoverRef}
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
      hidden,
      change,
      FieldWrapper,
      fieldPath,
      revertHovered,
      t,
      value,
      DiffComponent,
      isComparingCurrent,
      isPermissionsLoading,
      permissions?.granted,
      closeRevertChangesConfirmDialog,
      handleRevertChanges,
      confirmRevertOpen,
      handleRevertChangesConfirm,
      handleRevertButtonMouseEnter,
      handleRevertButtonMouseLeave,
      readOnly,
    ],
  )

  return content
}
