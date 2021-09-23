import {useDocumentOperation} from '@sanity/react-hooks'
import React, {useCallback, useContext, useState} from 'react'
import {unstable_useCheckDocumentPermission as useCheckDocumentPermission} from '@sanity/base/hooks'
import {rem, Stack, Box, Button, Text, Grid, Popover, useClickOutside} from '@sanity/ui'
import styled from 'styled-components'
import {undoChange} from '../changes/undoChange'
import {DiffContext} from '../contexts/DiffContext'
import {FieldChangeNode, OperationsAPI} from '../../types'
import {ChangeBreadcrumb} from './ChangeBreadcrumb'
import {DiffErrorBoundary} from './DiffErrorBoundary'
import {DiffInspectWrapper} from './DiffInspectWrapper'
import {DocumentChangeContext} from './DocumentChangeContext'
import {FallbackDiff} from './FallbackDiff'
import {RevertChangesButton} from './RevertChangesButton'
import {ValueError} from './ValueError'

import {BoxContentWrapper} from './FieldChange.styled'

const FieldChangeContainer = styled.div`
  --field-change-error: ${({theme}) => theme.sanity.color.solid.critical.enabled.bg};
  &[data-revert-all-changes-hover] [data-revert-all-hover]::before {
    border-left: 2px solid var(--field-change-error);
  }
`

const DiffBorder = styled.div`
  --field-change-error: ${({theme}) => theme.sanity.color.solid.critical.enabled.bg};
  --diff-inspect-padding-xsmall: ${({theme}) => rem(theme.sanity.space[1])};
  --diff-inspect-padding-small: ${({theme}) => rem(theme.sanity.space[2])};

  position: relative;
  padding: var(--diff-inspect-padding-xsmall) 0 var(--diff-inspect-padding-xsmall)
    var(--diff-inspect-padding-small);

  &::before {
    content: '';
    display: block;
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    border-left: 1px solid var(--card-border-color);
  }

  &[data-error]:hover::before,
  &[data-revert-field-hover]:hover::before {
    border-left: 2px solid var(--field-change-error);
  }
`

export function FieldChange({
  change,
  readOnly,
  ...restProps
}: {change: FieldChangeNode; readOnly?: boolean} & React.HTMLAttributes<HTMLDivElement>) {
  const DiffComponent = change.diffComponent || FallbackDiff
  const {
    documentId,
    schemaType,
    rootDiff,
    isComparingCurrent,
    FieldWrapper = React.Fragment,
  } = useContext(DocumentChangeContext)
  const docOperations = useDocumentOperation(documentId, schemaType.name) as OperationsAPI
  const [confirmRevertOpen, setConfirmRevertOpen] = React.useState(false)
  const [revertHovered, setRevertHovered] = useState(false)
  const [revertButtonElement, setRevertButtonElement] = useState<HTMLDivElement | null>(null)

  const updatePermission = useCheckDocumentPermission(documentId, schemaType.name, 'update')

  const handleRevertChanges = useCallback(() => {
    undoChange(change, rootDiff, docOperations)
  }, [change, rootDiff, docOperations])

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

  useClickOutside(() => setConfirmRevertOpen(false), [revertButtonElement])

  return change.schemaType.hidden === true ? null : (
    <Stack space={1} as={FieldChangeContainer} {...restProps}>
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
                <DiffComponent diff={change.diff} schemaType={change.schemaType as any} />
              </DiffContext.Provider>
            </DiffErrorBoundary>
          )}
          {isComparingCurrent && updatePermission.granted && (
            <Popover
              content={
                <BoxContentWrapper padding={3} sizing="border">
                  abc Are you sure you want to revert the changes?
                  <Grid columns={2} gap={2} marginTop={2}>
                    <Button mode="ghost" onClick={closeRevertChangesConfirmDialog}>
                      <Text align="center">Cancel</Text>
                    </Button>
                    <Button tone="critical" onClick={handleRevertChanges}>
                      <Text align="center">Revert change</Text>
                    </Button>
                  </Grid>
                </BoxContentWrapper>
              }
              open={confirmRevertOpen}
              portal
              placement="left"
              preventOverflow
            >
              <Box flex={1}>
                <RevertChangesButton
                  onClick={handleRevertChangesConfirm}
                  onMouseEnter={handleRevertButtonMouseEnter}
                  onMouseLeave={handleRevertButtonMouseLeave}
                  ref={setRevertButtonElement}
                  selected={confirmRevertOpen}
                  disabled={
                    readOnly || change?.parentSchema?.readOnly || change.schemaType.readOnly
                  }
                />
              </Box>
            </Popover>
          )}
        </DiffInspectWrapper>
      </FieldWrapper>
    </Stack>
  )
}
