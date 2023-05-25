import React, {useMemo, useId} from 'react'
import styled from 'styled-components'
import {Box, Dialog, Button, Text, Spinner, Grid, Flex} from '@sanity/ui'
import {DocTitle} from '../DocTitle'
import {useReferringDocuments} from './useReferringDocuments'
import {ConfirmDeleteDialogBody} from './ConfirmDeleteDialogBody'

/** @internal */
export const DialogBody = styled(Flex).attrs({
  padding: 4,
  direction: 'column',
  height: 'fill',
})`
  box-sizing: border-box;
`

/** @internal */
export const LoadingContainer = styled(Flex).attrs({
  align: 'center',
  direction: 'column',
  justify: 'center',
})`
  height: 300px;
`

/** @internal */
export interface ConfirmDeleteDialogProps {
  /**
   * Incoming document ID used to find other referencing documents. This
   * field respects draft IDs (e.g. if you pass in a published ID when one
   * doesn't exist the document title may not show up).
   */
  id: string
  /**
   * The schema typename of the incoming document
   */
  type: string
  /**
   * The name of the action being done. (e.g. the `'unpublish'` action requires
   * the same document deletion confirmation).
   */
  action?: string
  onCancel: () => void
  onConfirm: () => void
}

/**
 * A confirmation dialog used to prevent unwanted document deletes. Loads all
 * the referencing internal and cross-data references prior to showing the
 * delete button.
 *
 * @internal
 */
export function ConfirmDeleteDialog({
  id,
  type,
  action = 'delete',
  onCancel,
  onConfirm,
}: ConfirmDeleteDialogProps) {
  const dialogId = `deletion-confirmation-${useId()}`
  const {
    internalReferences,
    crossDatasetReferences,
    isLoading,
    totalCount,
    projectIds,
    datasetNames,
    hasUnknownDatasetNames,
  } = useReferringDocuments(id)
  const capitalizedAction = `${action.substring(0, 1).toUpperCase()}${action.substring(1)}`

  const documentTitle = <DocTitle document={useMemo(() => ({_id: id, _type: type}), [id, type])} />
  const showConfirmButton = !isLoading

  return (
    <Dialog
      width={1}
      id={dialogId}
      header={`${capitalizedAction} document?`}
      footer={
        <Grid columns={showConfirmButton ? 2 : 1} gap={2} paddingX={4} paddingY={3}>
          <Button mode="ghost" onClick={onCancel} text="Cancel" />

          {showConfirmButton && (
            <Button
              data-testid="confirm-delete-button"
              text={totalCount > 0 ? `${capitalizedAction} anyway` : `${capitalizedAction} now`}
              tone="critical"
              onClick={onConfirm}
            />
          )}
        </Grid>
      }
      onClose={onCancel}
      onClickOutside={onCancel}
    >
      <DialogBody>
        {crossDatasetReferences && internalReferences && !isLoading ? (
          <ConfirmDeleteDialogBody
            crossDatasetReferences={crossDatasetReferences}
            internalReferences={internalReferences}
            documentTitle={documentTitle}
            isLoading={isLoading}
            totalCount={totalCount}
            action={action}
            projectIds={projectIds}
            datasetNames={datasetNames}
            hasUnknownDatasetNames={hasUnknownDatasetNames}
            onReferenceLinkClick={onCancel}
          />
        ) : (
          <LoadingContainer data-testid="loading-container">
            <Spinner muted />
            <Box marginTop={3}>
              <Text align="center" muted size={1}>
                Looking for referring documents…
              </Text>
            </Box>
          </LoadingContainer>
        )}
      </DialogBody>
    </Dialog>
  )
}
